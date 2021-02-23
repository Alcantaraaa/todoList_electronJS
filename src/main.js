const fs = require('fs')

let saveHolder = {};
let currentProject = "";
let tasksList = [];
let concludedTasks = 0;
fs.readFile('./save.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err);
        return
    }
    console.log('File data:', jsonString);
    saveHolder = JSON.parse(jsonString);
    for (let items in saveHolder.Projects) {
        document.getElementById("mySidenav").insertAdjacentHTML("afterbegin", `
          <a href="#" onclick="openProject(this)" class="project">${items}</a>
          `);
        if (currentProject == "") {
            currentProject = items;
        }
    }
    refreshProject();
    console.log(saveHolder);
})

function getElementIndex(element) {
    let index = 0;
    for (let item in saveHolder.Projects[currentProject]) {
        if (saveHolder.Projects[currentProject][item] == element) {
            return index;
        }
        index++;
    }
}

function addItem() {
    var itemname = document.getElementById("itemname").value;
    if (itemname != "") {
        document.getElementById("listholder").insertAdjacentHTML("afterbegin", `
          <div class="listdiv slide">
            <span class="listitem" onclick="openTaskDescription(this)">${itemname}</span>
            <button id="removefromlistbutton" class="removefromlistbutton" onclick="removeItem(this)"></button>
            <button id="marktaskascompletebutton" class="marktaskascompletebutton" onclick="markAsCompleteItem(this)"></button>
          </div>
        `)
        document.getElementById("itemname").value = "";
        addItemJSON(itemname);
    }
}

function addItemJSON(itemname) {
    saveHolder.Projects[currentProject][itemname] = {};
    saveHolder.Projects[currentProject][itemname]["position"] = 0;
    saveHolder.Projects[currentProject][itemname]["description"] = "";
    saveHolder.Projects[currentProject][itemname]["status"] = false;
    for (var i = 0; i < tasksList.length; i++) {
        saveHolder.Projects[currentProject][tasksList[i]]["position"] += 1;
    }
    saveJSON();
    refreshProject();
}

function removeItem(item) {
    removeItemJSON(item.parentElement.children[0].innerHTML);
}

function removeItemJSON(itemname) {
    var j = saveHolder.Projects[currentProject][itemname]["position"];
    for (var i = j; i < tasksList.length; i++) {
        saveHolder.Projects[currentProject][tasksList[i]]["position"] -= 1;
    }
    delete saveHolder.Projects[currentProject][itemname];
    saveJSON();
    refreshProject();
}

function markAsCompleteItem(item) {
    if (!item.parentElement.children[0].classList.contains("complete")) {
        markAsCompleteItemJSON(item.parentElement.children[0].innerHTML, true);
        item.parentElement.children[0].classList.add("complete");
    } else {
        markAsCompleteItemJSON(item.parentElement.children[0].innerHTML, false);
        item.parentElement.children[0].classList.remove("complete");
    }
}

function markAsCompleteItemJSON(itemname, status) {
    saveHolder.Projects[currentProject][itemname]["status"] = status;
    if (status) {
        for (var i = saveHolder.Projects[currentProject][itemname]["position"]; i < tasksList.length; i++) {
            saveHolder.Projects[currentProject][tasksList[i]]["position"] -= 1;
        }
        saveHolder.Projects[currentProject][itemname]["position"] = tasksList.length - 1;
    } else {
        for (var i = 0; i < saveHolder.Projects[currentProject][itemname]["position"]; i++) {
            saveHolder.Projects[currentProject][tasksList[i]]["position"] += 1;
        }
        saveHolder.Projects[currentProject][itemname]["position"] = 0;
    }
    saveJSON();
    refreshProject();
}

var input = document.getElementById("itemname");

input.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("addtolistbutton").click();
    }
});

var keepTopPosition = 0;
var currentChangingTask = "";
var currentChangingTaskPosition = 0;
var expectedChangingTaskPosition = 0;
$(".slides").sortable({
    placeholder: 'slide-placeholder',
    axis: "y",
    revert: 150,
    start: function (e, ui) {

        placeholderHeight = ui.item.outerHeight();
        ui.placeholder.height(placeholderHeight + 15);
        $('<div class="slide-placeholder-animator" data-height="' + placeholderHeight + '"></div>').insertAfter(ui.placeholder);
        currentChangingTask = ui.item[0].innerText;
        currentChangingTaskPosition = saveHolder.Projects[currentProject][currentChangingTask]["position"];
        expectedChangingTaskPosition = currentChangingTaskPosition;
        keepTopPosition = ui.originalPosition.top;
    },
    change: function (event, ui) {
        ui.placeholder.stop().height(0).animate({
            height: ui.item.outerHeight() + 15
        }, 300);

        placeholderAnimatorHeight = parseInt($(".slide-placeholder-animator").attr("data-height"));

        $(".slide-placeholder-animator").stop().height(placeholderAnimatorHeight + 15).animate({
            height: 0
        }, 300, function () {
            $(this).remove();
            placeholderHeight = ui.item.outerHeight();
            $('<div class="slide-placeholder-animator" data-height="' + placeholderHeight + '"></div>').insertAfter(ui.placeholder);
        });
        console.log(keepTopPosition + " " + ui.offset.top)
        if (keepTopPosition > ui.offset.top) {
            expectedChangingTaskPosition--;
        } else {
            expectedChangingTaskPosition++;
        }
        keepTopPosition = ui.position.top;

    },
    stop: function (e, ui) {
        $(".slide-placeholder-animator").remove();
        console.log(currentChangingTaskPosition + " " + expectedChangingTaskPosition);
        if (saveHolder.Projects[currentProject][currentChangingTask]["status"]) { refreshProject(); return; }
        if (currentChangingTaskPosition == expectedChangingTaskPosition) return;
        if (expectedChangingTaskPosition > ((tasksList.length - 1) - concludedTasks)) {
            keepTopPosition = ui.originalPosition.top;
            expectedChangingTaskPosition = (tasksList.length - 1) - concludedTasks;
        }
        for (var items in saveHolder.Projects[currentProject]) {
            if (currentChangingTaskPosition < expectedChangingTaskPosition) {
                if (saveHolder.Projects[currentProject][items]["position"] >= currentChangingTaskPosition && saveHolder.Projects[currentProject][items]["position"] <= expectedChangingTaskPosition) {
                    saveHolder.Projects[currentProject][items]["position"] -= 1;
                }
            } else {
                if (saveHolder.Projects[currentProject][items]["position"] >= expectedChangingTaskPosition && saveHolder.Projects[currentProject][items]["position"] <= currentChangingTaskPosition) {
                    saveHolder.Projects[currentProject][items]["position"] += 1;
                }
            }
        }
        saveHolder.Projects[currentProject][currentChangingTask]["position"] = expectedChangingTaskPosition;
        saveJSON();
        refreshProject();
    },
});

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

function newProject() {
    var projectName = document.getElementById("projectname").value;
    if (projectName != "" && projectName != " ") {
        document.getElementById("projectname").value = "";
        document.getElementById("mySidenav").insertAdjacentHTML("afterbegin", `
          <a href="#" onclick="openProject(this)" class="project">${projectName}</a>
          `);
        newProjectJSON(projectName);
    }
}

function newProjectJSON(itemname) {
    saveHolder.Projects[itemname] = {};
    saveJSON();
}

function openProject(item) {
    var projectName = item.innerHTML;
    currentProject = projectName;
    refreshProject();
    closeNav();
}

function refreshProject() {
    concludedTasks = 0;
    document.getElementById("listholder").innerHTML = "";
    tasksList = [];
    for (let items in saveHolder.Projects[currentProject]) {
        tasksList[saveHolder.Projects[currentProject][items]["position"]] = items;
    }
    console.log(tasksList);
    for (var i = tasksList.length - 1; i >= 0; i--) {
        if (!saveHolder.Projects[currentProject][tasksList[i]]["status"]) {
            document.getElementById("listholder").insertAdjacentHTML("afterbegin", `
          <div class="listdiv slide">
              <span class="listitem" onclick="openTaskDescription(this)">${tasksList[i]}</span>
              <button id="removefromlistbutton" class="removefromlistbutton" onclick="removeItem(this)"></button>
              <button id="marktaskascompletebutton" class="marktaskascompletebutton" onclick="markAsCompleteItem(this)"></button>
            </div>
          `)
        } else {
            document.getElementById("listholder").insertAdjacentHTML("afterbegin", `
          <div class="listdiv slide">
              <span class="listitem complete" onclick="openTaskDescription(this)">${tasksList[i]}</span>
              <button id="removefromlistbutton" class="removefromlistbutton" onclick="removeItem(this)"></button>
              <button id="marktaskascompletebutton" class="marktaskascompletebutton" onclick="markAsCompleteItem(this)"></button>
            </div>
          `)
            concludedTasks++;
        }
    }
    closeNav();
}

function deleteProject() {
    if (document.getElementById("checkboxdeleteprojectbutton").checked) {
        if (currentProject == "Default") {
            document.getElementById("checkboxdeleteprojectbutton").checked = false;
            return;
        }
        document.getElementById("checkboxdeleteprojectbutton").checked = false;
        document.getElementById("listholder").innerHTML = "";
        delete saveHolder.Projects[currentProject]
        for (var child in document.getElementById("mySidenav").children) {
            if (document.getElementById("mySidenav").children[child].innerText == currentProject) {
                document.getElementById("mySidenav").children[child].remove();
            }
        }
        for (var child in document.getElementById("mySidenav").children) {
            console.log(document.getElementById("mySidenav").children[child].classList);
            if (document.getElementById("mySidenav").children[child].classList.contains("project")) {
                openProject(document.getElementById("mySidenav").children[child]);
                break;
            }
        }
        closeNav();
        saveJSON();
    }
}

var currentTask = "";
function openTaskDescription(element) {
    document.getElementById("taskdescriptionholder").style.display = "block";
    var taskname = element.innerHTML;
    currentTask = taskname;
    document.getElementById("taskdescriptionholder").children[0].children[0].innerHTML = taskname;
    document.getElementById("taskdescriptionholder").children[0].children[1].value = saveHolder.Projects[currentProject][taskname]["description"];
}

function closeTaskDescription() {
    document.getElementById("taskdescriptionholder").style.display = "none";
    saveTaskDescription();
}

function saveTaskDescription() {
    saveHolder.Projects[currentProject][currentTask]["description"] = document.getElementById("taskdescriptionholder").children[0].children[1].value;
    document.getElementById("taskdescriptionholder").children[0].children[1].value = "";
    saveJSON();
}

function saveJSON() {
    fs.writeFile("./save.json", JSON.stringify(saveHolder), err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
            fs.readFile('./save.json', 'utf8', (err, jsonString) => {
                if (err) {
                    console.log("File read failed:", err)
                    return
                }
                console.log('File data:', jsonString)
            })
        }
    })
}