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
        var get_tag = actual_data[i].tag_name;
        button_list.innerHTML += '<div class="tags_button">' +
            get_tag +
            ' <span class="tags_delete" onclick="tag_delete(' + i + ')">x</span></div>'
    }
}

function putTag(tag_name) {
    var tag_input = gId('tag_input')

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

function deleteStoryTags(i) {
    var tags = localStorage.getItem("Tag");
    var new_tags = JSON.parse(tags);
    new_tags.splice(i, 1);
    localStorage.setItem("Tag", JSON.stringify(new_tags));
    getStoryTags();
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

// get story Id
function storyIdFromUrl() {
    var currUrl = document.URL.split(['/']);
    return currUrl[currUrl.length - 1];
}

// Checking if browser support localStorage
function supportsLocalStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
}