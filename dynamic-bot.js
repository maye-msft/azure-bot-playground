const { ActivityTypes } = require('botbuilder');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, DateTimePrompt, ConfirmPrompt, WaterfallDialog, DialogTurnStatus } = require('botbuilder-dialogs');
const { QnAMaker, QnAMakerEndpoint, QnAMakerOptions } = require('botbuilder-ai');

const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'user';

class DynamicBot {
    constructor(conversationState, userState) {
        this.userState = userState;
        this.conversationState = conversationState;
        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userProfile = this.userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new TextPrompt('textPrompt'));
        this.dialogs.add(new ChoicePrompt('choicePrompt'));
        this.dialogs.add(new NumberPrompt('numberPrompt'));
        this.dialogNames = [];

        this.rootDialog = null;
    }
    initDialogs() {
        this.dialogs = new DialogSet(this.dialogState);
        this.dialogs.add(new TextPrompt('textPrompt'));
        let choicePrompt = new ChoicePrompt('choicePrompt')
        //choicePrompt.style = ListStyle.list
        this.dialogs.add(choicePrompt);
        this.dialogs.add(new NumberPrompt('numberPrompt'));
        this.dialogs.add(new DateTimePrompt('datetimePrompt'));
        this.dialogs.add(new ConfirmPrompt('confirmPrompt'));
        this.dialogNames = [];
        this.rootDialog = null;
    }
    buildDialogModel(model) {
        console.log(JSON.stringify(model, null, 4))
        this.initDialogs()
        let instance = this;
        model.dialogs.forEach(dialog => {
            let fallArray = [];
            let hasQnA = false;
            dialog.activities.forEach((activity, activityIdx) => {
                let qnamaker = null
                if (activity.type == 'QnA') {
                    const qnaEndpointSettings = {
                        knowledgeBaseId: activity.qna_kbid,
                        endpointKey: activity.qna_endpointKey,
                        host: activity.qna_hostname
                    };
                    qnamaker = new QnAMaker(qnaEndpointSettings, {});
                    hasQnA = true;
                }
                ((activity, activityIdx) => {
                    instance.buildDialogStep(activity, fallArray, dialog, activityIdx, qnamaker)
                })(activity, activityIdx)

            });
            if (dialog.ending) {
                fallArray.push(async function (step) {
                    await step.context.sendActivity(dialog.ending);
                    return await step.endDialog();
                });
            }


            instance.dialogs.add(new WaterfallDialog(dialog.name, fallArray));
            instance.dialogNames.push(dialog.name)
        });
        if (!model || model.dialogs.length == 0) {
            instance.rootDialog = 'hello'
            instance.dialogs.add(new WaterfallDialog('hello', [async function (step) {
                return await step.prompt('textPrompt', 'hello!');
            }]
            ));
            instance.dialogNames.push('hello')
        } else {
            instance.rootDialog = instance.dialogNames[0]
        }



    }

    buildDialogStep(activity, array, dialog, activityIdx, qnamaker) {

        let greeting = activityIdx == 0 ? dialog.greeting : null

        let greeetingFunc = async function (step) {
            return await step.context.sendActivity(greeting);
        }



        //let cancelDialogs = ()=>{return false}    
        if (activity.type === 'text') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)
                return await step.prompt('textPrompt', activity.message);


            });
            array.push(async function (step) {
                if (step.result.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                } else {
                    return step.continueDialog();
                }
            });

        } else if (activity.type === 'number') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)

                return await step.prompt('numberPrompt', activity.message);


            });
            array.push(async function (step) {
                if (step.result.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                } else {
                    return step.continueDialog();
                }
            });
        } else if (activity.type === 'choice') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)

                return await step.prompt('choicePrompt', activity.message, activity.options);
                

            });
            array.push(async function (step) {
                if (step.result.value.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                } else {
                    return step.continueDialog();
                }
            });
        } else if (activity.type === 'confirm') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)
                return await step.prompt('confirmPrompt', activity.message);

            });
            array.push(async function (step) {
                if (step.result.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                } else {
                    return step.continueDialog();
                }
            });
        } else if (activity.type === 'datetime') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)
                return await step.prompt('datetimePrompt', activity.message);


            });
            array.push(async function (step) {
                if (step.result.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                } else {
                    return step.continueDialog();
                }
            });
        } else if (activity.type === 'dialog-menu') {

            array.push(
                async function (step) {
                    if (greeting)
                        await greeetingFunc(step)
                    return await step.prompt('choicePrompt', activity.message, activity.menuitems);

                });

            array.push(
                async function (step) {
                    let result = null;
                    // Handle the user's response to the previous prompt and branch the dialog.
                    for (let i = 0; i < activity.menuitems.length; i++) {
                        //activity.options.forEach((item, itemIdx)=> {
                        if (step.result.value == activity.menuitems[i]) {
                            return await step.beginDialog(activity.menuitemdialogs[i]);
                        }
                    }
                    

                    //});
                });

        } else if (activity.type === 'QnA') {
            array.push(async function (step) {
                if (greeting)
                    await greeetingFunc(step)
                return step.prompt('textPrompt', activity.message);



            });

            array.push(async function (step) {
                if (step.result.match(/cancel/ig)) {
                    await step.context.sendActivity("cancelled");
                    return await step.endDialog();

                }
                try {
                    const qnaResults = await qnamaker.generateAnswer(step.result);

                    if (qnaResults[0]) {
                        await step.context.sendActivity(qnaResults[0].answer);
                        return await step.replaceDialog(dialog.name);
                    } else {
                        await step.context.sendActivity("Cannot find answer!");
                    }
                } catch (err) {
                    await step.context.sendActivity("Error: " + err);
                    console.log(err);
                }

            });
        }



    }

    async onTurn(turnContext) {

        let dc = await this.dialogs.createContext(turnContext);

        if (turnContext.activity.type === ActivityTypes.Message) {

            const utterance = (turnContext.activity.text || '').trim();


            if (utterance.match(/bye/ig)) {
                await dc.cancelAllDialogs();
                await dc.context.sendActivity('You cancelled the conversation.');
                return await dc.beginDialog(this.rootDialog);
            }

            let dialogTurnResult = await dc.continueDialog();
            if (!turnContext.responded) {
                await dc.beginDialog(this.rootDialog);
            }



        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {

            await dc.beginDialog(this.rootDialog);

        }

        // Save state changes
        await this.conversationState.saveChanges(turnContext);
    }
}

module.exports.MainBot = DynamicBot;