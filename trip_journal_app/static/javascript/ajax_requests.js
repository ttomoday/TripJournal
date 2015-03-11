/**
 * Module for sending ajax POST request with block contents from edit page.
 */
// for browser that don't support endsWith method for strings
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

// get story Id
function storyIdFromUrl() {
    var currUrl = document.URL.split(['/']);
    return currUrl[currUrl.length - 1];
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

function storyBlocksJson() {
    var blocks = [];
    var datetime = new Date();
    datetime.setSeconds(datetime.getSeconds() - 15);

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

function postImages(storyId) {
    var i, formData, xhr, img, pic;
    countPicture = Images.length
    /**
     * Sets hidden element with
     * picture id from database when picture is saved.
     */
    function addImageIdFromDB() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            picIdInDB = parseInt(xhr.responseText);
            var pictures = document.getElementsByClassName("image_story");
            for (var i = 0; i < countPicture; i++) {
                pictures[pictures.length - i - 1].setAttribute("data-dbid", picIdInDB - i);
            }
            postData(true);
        }
    }

    for (i = 0; i < Images.length; ++i) {
        formData = new FormData();
        img = Images[i]
        formData.append('file', img);
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            addImageIdFromDB();
        };
        xhr.open('POST', '/upload/' + storyIdFromUrl(), true);
        xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
        xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
        xhr.send(formData);
    }
    Images = [];
}


function postData(async) {
    var xhr = new XMLHttpRequest(),
        requestBody = JSON.stringify(storyBlocksJson());

    // Add to localStorage
    if (supportsLocalStorage()) {
        addToLocalStorrage("Block_content", requestBody);
    }

    /**
     * Appends story id to page url and urls form publsih panel
     * and makes publish panel visble
     * if request was sent from /edit/ page.
     */
    function addStoryIdToUrls() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var newId = xhr.responseText;
            if (!document.URL.endsWith(newId)) {
                window.history.pushState(
                    'new_id', 'Title', '/edit/' + newId
                );
                var publish_panel = document.getElementById('publish_panel');
                publish_panel.className = 'block';
                publish_panel.style.display = 'block';
                document.getElementById('publish_form').action = '/publish/' + newId;
                document.getElementById('view_form').action = '/story/' + newId;
            }
        }
    }
    xhr.onreadystatechange = addStoryIdToUrls;
    xhr.open('POST', '/save/' + storyIdFromUrl(), async);
    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.send(requestBody);
}


function savePage() {
    if (storyIdFromUrl().length === 0) postData(false);
    if (Images.length > 0) {
        postImages();
    } else {
        postData(true);
    }
}

function jsonTagStory(tag_name) {
    var blocks = [];
    var datetime = new Date();
    datetime.setSeconds(datetime.getSeconds() - 15);

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

function putTag(tag_name) {
    var tag_input = gId('tag_input')
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/put_tag/', true);
    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            tag_input.value = '';
            getStoryTags();
            savePage();
        }
    }

    request_body = JSON.stringify(jsonTagStory(tag_name));

    if (supportsLocalStorage()) {
        var tagStory = jsonTagStory(tag_name);
        addToLocalStorrage("Tag", JSON.stringify(tagStory[tagStory.length - 1]));
    };

    xhr.send(request_body);
}

function getStoryTags() {
    story_id = storyIdFromUrl();
    if (story_id) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var str = xhr.responseText;
                var tags = JSON.parse(str);
                var localStorageTags = getLocalStorageTags();
                if (localStorageTags != null && localStorageTags.length > 0) {
                    var localStorageTagsDate = new Date(localStorageTags[localStorageTags.length - 1].datetime);
                    var serverTagsDate = new Date(tags[tags.length - 1].datetime);
                    if (localStorageTagsDate > serverTagsDate) {
                        tags_view(localStorageTags);
                        putTag(localStorageTags[localStorageTags.length - 1].tag_name);
                    } else {
                        tags_view(tags);
                    }
                } else {
                    tags_view(tags);
                }
            }
        }
        params = 'Story_id=' + story_id;
        xhr.open('GET', '/get_story_tags/?' + params, true);
        xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
        xhr.send();
    }
}

function getLocalStorageTags() {
    var localStorage_tags = localStorage.getItem("Tag");
    var tags_list = JSON.parse(localStorage_tags);
    return tags_list;
}

function tags_view(tags_arr) {
    var actual_data = tags_arr;

    button_list.innerHTML = '';

    for (var i = 0; i < actual_data.length; i++) {
        var get_tag = actual_data[i].name || actual_data[i].tag_name;
        button_list.innerHTML += '<div class="tags_button">' +
            get_tag +
            ' <span class="tags_delete" onclick="tag_delete(' + i + ')">x</span></div>'
    }
}

function deleteStoryTags(i) {
    if (supportsLocalStorage()) {
        var tags = localStorage.getItem("Tag");
        var new_tags = JSON.parse(tags);
        new_tags.splice(i, 1);
        localStorage.setItem("Tag", JSON.stringify(new_tags));
        getStoryTags();
    }
    var xhr = new XMLHttpRequest();
    story_id = storyIdFromUrl();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            getStoryTags();
        }
    }
    params = 'Story_id=' + encodeURIComponent(story_id) + '&Tag_position=' + i;
    xhr.open('GET', '/delete_story_tag/?' + params, true);
    xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
    xhr.send();
}

function getId() {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            getStoryTags();
        }
    }
    params = 'Story_id=' + encodeURIComponent(story_id) + '&Tag_position=' + i;
    xhr.open('GET', '/delete_story_tag/?' + params, true);
    xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
    xhr.send();
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