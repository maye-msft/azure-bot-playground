const model = {
    name: "simple",
    dialogs: [
        {
            name: "root",
            activities: [
                {
                    type: "menu",
                    options: ["dialog 1", "dialog 2"],
                    optiondialogs: ["dialog 1", "dialog 2"],
                    message: "Please choose dialog"
                }
            ]
        },
        {
            name: "dialog 1",
            activities: [
                {
                    type: "text",
                    message: "What is your name?"
                },
                {
                    type: "number",
                    message: "What is your age?"
                }
            ]
        },
        {
            name: "dialog 2",
            activities: [
                {
                    type: "text",
                    message: "What is your job?"
                },
                {
                    type: "choice",
                    message: "What is your gender?",
                    options: ["Male", "Female"],
                }
            ]
        }
    ]
}
const store = new Vuex.Store({
    state: {
        dialogs: []
    },
    mutations: {
        addDialog(state, dialog) {
            state.dialogs.push(dialog)
        },
        removeDialog(state, idx) {
            state.dialogs.splice(idx, 1)
        },
        importDialogs(state, json) {
            state.dialogs = json
        }
    }
})
var app = new Vue({
    el: '#app',
    store: store,
    methods: {
        addDialog() {
            this.$store.commit('addDialog', { name: 'Dialog ' + (this.$store.state.dialogs.length + 1), activities: [{ type: 'text', message: 'hello', options: ['option 1', 'option 2'] }] })
        },
        postModel() {
            var model = { name: "dialog", dialogs: this.$store.state.dialogs }
            axios.post('/model', model)
                .then(function (response) {
                    console.log(response);
                    document.getElementById('chatbox').contentDocument.location.reload(true);
                })
                .catch(function (error) {
                    console.log(error);
                });
        },
        addOption(activity) {

            activity.options = activity.options || [];
            activity.options.push('option ' + (activity.options.length + 1))
            this.$forceUpdate()
        },
        removeOption(activity, optionIdx) {

            activity.options.splice(optionIdx, 1)
            this.$forceUpdate()
        },
        addMenuItem(activity) {
            activity.menuitems = activity.menuitems || [];
            activity.menuitemdialogs = activity.menuitemdialogs || [];
            activity.menuitems.push('Menu Item ' + (activity.menuitems.length + 1))
            activity.menuitemdialogs.push('')
            this.$forceUpdate()
        },
        removeMenuItem(activity, menuitemIdx) {

            activity.menuitems.splice(menuitemIdx, 1)
            activity.menuitemdialogs.splice(menuitemIdx, 1)
            this.$forceUpdate()
        },
        exportDialogs() {
            var blob = new Blob([JSON.stringify(this.$store.state.dialogs)], { type: "application/json;charset=utf-8" });
            saveAs(blob, "dialogs.json");
        },
        importDialogs() {
            var that = this;
            
            window.openFile(function(json){
                that.$store.commit('importDialogs', JSON.parse(json))
            });
        }
    },
    computed: {
        ...Vuex.mapState([
            'dialogs'
        ])

    },
    data: {

    },
    mounted: function () {
        // axios.post('/model', null)
        // .then(function (response) {
        //     console.log(response);
        // })
        // .catch(function (error) {
        //     console.log(error);
        // });
    }
})



function clickElem(elem) {
    // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
    var eventMouse = document.createEvent("MouseEvents")
    eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    elem.dispatchEvent(eventMouse)
}
function openFile(func) {
    readFile = function (e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            fileInput.func(contents)
            document.body.removeChild(fileInput)
        }
        reader.readAsText(file)
    }
    fileInput = document.createElement("input")
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    fileInput.func = func
    document.body.appendChild(fileInput)
    clickElem(fileInput)
}