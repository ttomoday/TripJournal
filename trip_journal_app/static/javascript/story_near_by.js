window.addEventListener('load', function(){    
	googleAPI.initialize(); // initialize the google map API

	gId("findAddres").addEventListener('click', googleAPI.codeAddress); //  find a place on the map

    document.addEventListener('click', crearInput); //  reset input value if click was not on button search place

    google.maps.event.addListener(map, 'idle', function(event){
        Content.updateContent()  // Update content on moving map
    });
})

//get elements by Id
function gId(id) {
    return document.getElementById(id)
}

// create element with given tag
function createElem(tag){
    return document.createElement(tag)
}

// show current page from url 
function currentPage(){
var urlArray=document.URL.split('/')
    return (urlArray[urlArray.length-2]=='stories_near_by') ? 'story': 'picture'
}

// cut the string to a given length
function cutStr(str, len){
    return str.length<len ? str: str.slice(0, len-3)+'...'   
}

// get cookie for Ajax request
function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    } else {
        return undefined;
    }
}

// reset input 'find place on map ' value 
function crearInput(e){
    var target=e.target
    if (target.id !="findAddres"){
        gId('address').value=""
    }

}


// module is responsible for receiving and creating content
var Content=(function(){ 
    
    //depending on the page sends a AJAX request to different views and then create a content of story or picture
    function updateContent(){
        if(map.getBounds()){
            var xhr = new XMLHttpRequest();
            if(currentPage()=='story'){
                //sends a AJAX request depending on the current page
                xhr.open('POST', '/get_story_list/', false);
            }else{
                xhr.open('POST', '/get_picture_list/', false);
            }            
            xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
            xhr.setRequestHeader('X_REQUESTED_WITH', 'XMLHttpRequest');
            xhr.onreadystatechange = function(){
                if (xhr.readyState === 4 && xhr.status==200){
                    // delete old content
                     resetContent();
                     if(currentPage()=='story'){
                        // create conten of story
                         createStories(xhr.responseText) 
                    }else{
                        // create content of picture                         
                         createPictures(xhr.responseText) 
                     }                              
                }
            }
            // send coordinates od map
            request_body =JSON.stringify({coordinates:map.getBounds()});
            xhr.send(request_body);
        }
    }

    function resetContent(){
        gId('story_container').innerHTML="";
        googleAPI.deleteAllMarkers()
    }

    // creates content of stories
    function createStories(json){
        var story_container=gId('story_container'),
        content=createElem('div'),
        jsonParse=JSON.parse(json);
        for (var i=0; i<jsonParse.length; i++){
            var story_block=jsonParse[i]         
            content.appendChild(Story.createStory(story_block))
            var storyLat=story_block.coordinates.lat
            var storyLng=story_block.coordinates.lng
            googleAPI.createMarker(story_block.id, storyLat, storyLng)                                  
        }
        story_container.appendChild(content)
    }

    // creates content of pictures
    function createPictures(json){
        var picture_container=gId('story_container'),
        content=createElem('div'),
        jsonParse=JSON.parse(json)
        for (var i=0; i<jsonParse.length; i++){
            picture_block=jsonParse[i]
            content.appendChild(Picture.createPicture(picture_block))
        var pictureLat=picture_block.latitude
        var pictureLng=picture_block.longitude
            googleAPI.createMarker(picture_block['id'], pictureLat, pictureLng)
        }
        story_container.appendChild(content)
    }

    return {
        updateContent:updateContent
    }
})()


// module of creation story
var Story=(function(){

    function createStory(story_block){
        var storyId=story_block.id
        var story=createStoryBlock(storyId)         
            if(story_block.picture){
                var pictureUrl=story_block.picture                  
                    story.appendChild(createStoryImage(pictureUrl))
            }
            if(story_block.title){
                var title=story_block.title
                    story.appendChild(createStoryTitle(title))
            }
            if(story_block.text){
                var storyText=story_block.text
                    story.appendChild(createStoryText(storyText))
            }
        var userStory=story_block.user
        var StoryTime=story_block.datetime
            story.appendChild(createStoryUserAndData(userStory, StoryTime))
            return story
    }

    function createStoryBlock(id){
        var story=createElem('a')
        story.className="story"
        story.setAttribute("href", "/story/"+id)

        // bind story and marker by story id
        story.addEventListener("mouseover",function(){googleAPI.activateMarker(id)})
        story.addEventListener("mouseout",function(){googleAPI.deactivateMarker(id)})
        return story;
    }
   
    function createStoryImage(pictureUrl){
        var img_wrapper=createElem("div");
        img_wrapper.className="img_wrapper";
        var img=createElem('img');
        img.src=pictureUrl;

        // show picture depending on its proportions
        if(img.width/img.height>1.5){                          
            img.setAttribute("height", 100+"%");
        }else{                            
            img.setAttribute("width", 100+"%"); 
        }        
        img_wrapper.appendChild(img);
        return img_wrapper;
    }

    function createStoryTitle(storyTitle){       
        var title=createElem("p");
        title.className="story_title";
        title.innerHTML=storyTitle;
        return title;
    }

    function createStoryText(storyText){
        var text=createElem("p")
        text.className="story_text"
        text.innerHTML=cutStr(storyText, 60)
        return text;
    }

    function createStoryUserAndData(userName, storyDataTime){
        var userAndData=createElem("p")
        userAndData.className="story_user_data"
        spanData=createElem("span")
        spanData.className="story_data"
        spanData.innerHTML=storyDataTime.slice(0,10)
        userAndData.appendChild(document.createTextNode(userName))
        userAndData.appendChild(spanData)
        return  userAndData;  
    }
    return {
        createStory:createStory
    }
})()


// module of creation picture
var Picture =(function(){

    function createPicture(picture_block){
       var id=picture_block['id']
    var block =createElem('div')
        block.className='picture'
    var picture_wrap=createElem('a')
        picture_wrap.setAttribute("href", "/story/"+picture_block['story_id'])
        picture_wrap.className=('picture_wrap')

        // bind story and marker by picture  id
        picture_wrap.addEventListener("mouseover",function(){googleAPI.activateMarker(id)})
        picture_wrap.addEventListener("mouseout",function(){googleAPI.deactivateMarker(id)})

    var image=createElem('img')
        image.src=picture_block["picture_url"]

        // show picture depending on its proportions
         if(image.width/image.height>1){                          
            image.setAttribute("width", 250+'px');
        }else{                            
            image.setAttribute("height", 200+'px'); 
        }        
        picture_wrap.appendChild(image)
        block.appendChild(picture_wrap)
        return block
    }

    return {
        createPicture:createPicture
    }
})()

// module of google API
var googleAPI=(function(){
    var Markers={} // Objects where key is ID of story or picture  and value is marker.

    // put marker on the map
    function createMarker(storyId, latityde, longitude){
        Markers[storyId] = new google.maps.Marker({
            position: new google.maps.LatLng(latityde, longitude),
            icon:UNACTIVE_ICON,
            map: map
        })
        Markers[storyId].setMap(map)
    }

    //highlight marker
    function activateMarker(index){
        Markers[index].setIcon(ACTIVE_ICON)
    }

    function deactivateMarker(index){
        Markers[index].setIcon(UNACTIVE_ICON)
    }


    function deleteAllMarkers(){
        for(index in Markers){
            Markers[index].setMap(null)
        }
        Markers={};
    }

    //Initialize the google map
    function initialize() {
        var LvivCenter=new google.maps.LatLng(49.839754, 24.029846) // coordinates of L'viv city center                
        geocoder = new google.maps.Geocoder();
        var mapOptions = {
            zoom: 14,      
        };
        map = new google.maps.Map(gId('map_canvas'), mapOptions);  

        // Set centers map on current position or L'viv city center.
        navigator.geolocation.getCurrentPosition(
            function(position){                
                var currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(currentPosition);
                var infowindow = new google.maps.InfoWindow({
                    map: map,
                    position: currentPosition,
                    content: "Я тут"
                });
            },
            function(){
                map.setCenter(LvivCenter);
            },{}) 
    }

    function codeAddress() {
        var address = gId('address').value;
        if (address==""){
            alert("Enter place pls...");
            return 
        }
        geocoder.geocode({
            'address': address
        }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
        gId('address').value=""
        });
    }

    return{
        createMarker:createMarker,
        activateMarker:activateMarker,
        deactivateMarker:deactivateMarker,
        deleteAllMarkers:deleteAllMarkers,
        initialize:initialize,
        codeAddress:codeAddress
    }
})()










