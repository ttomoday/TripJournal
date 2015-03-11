function getStoryTags() {
    var str = localStorage.getItem("Tag");
    if (str) {
        tags_view(JSON.parse(str));
    };
}

function tags_view(tags_arr) {
    // var actual_data = check_actual_tags(tags_arr);
    var actual_data = tags_arr[0];

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
    var blocks = [];
    var datetime = new Date();
    datetime.setMinutes(datetime.getMinutes() - 1);

    var tags_block = gId("tags_list").children[0];
    var tags_list = tags_block.childNodes;
    for (var i = 0; i < tags_list.length; i++) {
        var existing_tag_name = tags_list[i].childNodes[0].data;
        var block = {};
        block.story_id = storyIdFromUrl();
        block.tag_name = existing_tag_name;
        block.datetime = datetime;
        blocks.push(block);
    };

    var block = {};
    block.story_id = storyIdFromUrl();
    block.tag_name = tag_name;
    block.datetime = datetime;
    blocks.push(block);
    return blocks;
}

function deleteStoryTags(i) {
    var tags = localStorage.getItem("Tag");
    var new_tags = JSON.parse(tags);
    new_tags.splice(i, 1);
    localStorage.setItem("Tag", JSON.stringify(new_tags));
    getStoryTags();
}

function savePage() {
    if (storyIdFromUrl().length === 0) postData(false);
    if (Images.length > 0) {
        postImages();
    } else {
        postData(true);
    }
}

function postData(async) {
    requestBody = JSON.stringify(storyBlocksJson());
    addToLocalStorrage("Block_content", requestBody);
}

function storyBlocksJson() {
    var blocks = [];
    var datetime = new Date();

    story_title = document.getElementById("story_title")
    if (story_title.childNodes[0]) {
        var title = story_title.childNodes[0].nodeValue
    } else {
        var title = "";
    }

    var Blocks = document.getElementsByClassName("block_story");
    // alert(Blocks.length);
    for (var i = 0; i < Blocks.length; i++) {
        var block = {
            "type": Blocks[i].getAttribute("block_type"),
            "marker": getMarkerLocation(i)
        };
        if (block.type === 'text') {
            block.content = Blocks[i].children[0].innerHTML;
        }
        if (block.type === 'artifact') {
            block.content = Blocks[i].children[0].innerHTML;
        }
        if (block.type === 'img') {
            var imagesInBlock = Blocks[i].getElementsByClassName("image_story");
            // alert(imagesInBlock.length);
            if (imagesInBlock.length > 1) {
                block["galleryId"] = [];
                block.id = parseInt(imagesInBlock[0].getAttribute("data-dbid"));
                block["galleryId"][0] = parseInt(imagesInBlock[0].getAttribute("data-dbid"));
                for (var j = 1; j < imagesInBlock.length; j++) {
                    block["galleryId"][j] = parseInt(imagesInBlock[j].getAttribute("data-dbid"));
                }
            } else {
                block.id = parseInt(imagesInBlock[0].getAttribute("data-dbid"));
            }
        }
        blocks.push(block)
    }
    return {
        'datetime': datetime,
        'title': title,
        'blocks': blocks
    };
}

function getMarkerLocation(index) {
    if (Markers[index]) {
        var pos = Markers[index].getPosition();
        return {
            'lat': pos.lat(),
            'lng': pos.lng()
        };
    }
    return null;
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