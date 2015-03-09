var Images = []; //Array of pictures that will be uploaded.
var Markers = []; //Array of markers, index of marker in this array is equal to the index of the block that it belongs. 

window.onload = function() {
    alert("OFFLINE NEW");
    setMenu();
    // getStoryContent(); // get story content using AJAX
    getStoryTags(); // get story tegs using AJAX


    //EventListeners
    // gId('add_title').addEventListener("click", addTitle);
    // gId('story_title').addEventListener("blur", savePage);
    // gId('tag_input').addEventListener("change", tags_add);
    gId('tag_add').addEventListener("click", tags_add);
    // gId('type_file').addEventListener("change", add_img);
    // gId('story_content').addEventListener("mouseover", showKeybar);
    // gId('story_content').addEventListener("mouseout", hideKeybar);
    // gId('story_content').addEventListener("click", buttonsClick);
    // gId("added_artifact").addEventListener("click", showArtifactPanel);
    // gId("added_image").addEventListener("click", showImagePanel);
    // gId("added_text").addEventListener("click", showTextPanel);
    // gId("adds_block_t").addEventListener("click", save_text_story);
    // gId("adds_block_p").addEventListener("click", save_photo_story);
    // gId('photo_cont').addEventListener("click", deleteImageFromPhotoCont);
    // gId("adds_block_a").addEventListener("click", save_photo_artifact);
    // gId('findAddres').addEventListener("click", codeAddress);
    // clearBlocks = document.getElementsByClassName("delete_block")
    // for (var i = 0; i < clearBlocks.length; i++) {
    //     clearBlocks[i].addEventListener("click", clear);
    // }

    // call function what I have to do.
    toDo();
}

// function updateCache() {
//     // window.applicationCache.update();
//     window.applicationCache.swapCache();
// }

//get elements by Id
function gId(id) {
    return document.getElementById(id)
}

// Main menu in offline mode
function setMenu() {
    var menu = gId('menu');
    var menu_elements = menu.getElementsByTagName("a");
    for (var i = 0; i < menu_elements.length; i++) {
        if (menu_elements[i].getAttribute("href") != "/my_stories/") {
            menu.children[i].style.display = 'none';
        }
    }
}

//function adds tag
function tags_add(e) {
    var tag_input = gId('tag_input')
    var reg = /^[а-яa-z0-9іїє\s]+$/i;
    if (tag_input.value.search(reg) >= 0) {
        putTag(tag_input.value);
    } else {
        alert('input a-z, а-я, 0-9');
    }
    tag_input.focus();
    e.stopPropagation()
}

function putTag(tag_name) {
    if (supportsLocalStorage()) {
        // add data to localStorage
        request_body = JSON.stringify(jsonTagStory(tag_name));
        addToLocalStorrage("Tag", request_body);

        tag_input.value = '';
        getStoryTags();
    };
}

function jsonTagStory(tag_name) {
    var datetime = new Date();
    var block = {};
    block.story_id = storyIdFromUrl();
    block.tag_name = tag_name;
    block.datetime = datetime;
    return block;
}

// get story Id
function storyIdFromUrl() {
    var currUrl = document.URL.split(['/']);
    return currUrl[currUrl.length - 1];
}

// Checking if browser support localStorage
function supportsLocalStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
}

// Add JSON to localStorage 
function addToLocalStorrage(key, json_value) {
    var json_list = [];
    var parsed_json = JSON.parse(json_value);

    if (localStorage.getItem(key)) {
        for (var i = 0; i < JSON.parse(localStorage.getItem(key)).length; i++) {
            // Next line only for  tags
            if (JSON.parse(localStorage.getItem(key))[i].tag_name === parsed_json.tag_name) {
                continue
            };
            json_list.push(JSON.parse(localStorage.getItem(key))[i]);
        }
    }

    json_list.push(parsed_json);
    localStorage.setItem(key, JSON.stringify(json_list));
}

function getStoryTags() {
    var str = localStorage.getItem("Tag");
    if (str) {
        tags_view(JSON.parse(str));
    };
}

function tags_view(tags_arr) {
    // var actual_data = check_actual_tags(tags_arr);
    var actual_data = tags_arr;
    button_list.innerHTML = '';

    for (var i = 0; i < actual_data.length; i++) {
        var get_tag = actual_data[i].name || actual_data[i].tag_name;
        button_list.innerHTML += '<div class="tags_button">' +
            get_tag +
            ' <span class="tags_delete" onclick="tag_delete(' + i + ')">x</span></div>'
    }
}

// List of things, that I have to do, when the file offline.manifest will be right configured.
function toDo() {
    console.log(" ");
    console.log("TODO LIST");
    console.log(" 1. In file ajax_requests, uncomment 'check_actual_tags' \
         ");
    console.log(" ");
}