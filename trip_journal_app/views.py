import json
import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.core.urlresolvers import reverse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.sessions.backends.db import SessionStore
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.contrib.auth.models import User
from trip_journal_app.models import Story, Picture, Tag, Map_artifact, Subscriptions
from trip_journal_app.forms import UploadFileForm
from trip_journal_app.utils.story_utils import story_contents
from django.core.context_processors import csrf
from django.utils.translation import get_language_info
from django.utils.translation import activate
from django.utils import translation
from django.conf import settings as TripJournal_settings
from localization.views import try_activate_user_language


def home(request):
    """
    Home page view.
    """
    try_activate_user_language(request)
    stories = Story.objects.filter(published=True)
    context = {'stories': stories, 'user': auth.get_user(request)}
    return render(request, 'index.html', context)


@login_required
@require_POST
def save(request, story_id):
    """
    View for saving story contents. Responds only to ajax POST requests.
    """
    if request.is_ajax():
        user = auth.get_user(request)
        if story_id:
            story = get_object_or_404(Story, pk=int(story_id))
            if user != story.user:
                return HttpResponse('Unauthorized', status=401)
        else:
            story = Story()
            story.user = auth.get_user(request)
            story.date_travel = datetime.datetime.now().date()
        request_body = json.loads(request.body)
        story.title = request_body['title']
        story.text = json.dumps(request_body['blocks'], ensure_ascii=False)
        story.date_publish = datetime.datetime.now()
        story.save()
        for block in request_body['blocks']:
            if block["type"] == "img":
                if block["marker"] != None:
                    picture = Picture.objects.get(id=block["id"])
                    picture.latitude = block["marker"]["lat"]
                    picture.longitude = block["marker"]["lng"]
                    picture.save()
        return HttpResponse(story.id)


@login_required
@require_POST
def publish(request, story_id):
    user = auth.get_user(request)
    story = get_object_or_404(Story, pk=int(story_id))
    if user != story.user:
        return HttpResponse('Unathorized', status=401)
    assert request.POST['publish'] in (u'True', u'False')
    story.published = (request.POST['publish'] == 'False')
    story.save()
    return redirect('/story/%s' % story_id)


@login_required
@require_POST
def upload_img(request, story_id):
    # authorization part
    story = get_object_or_404(Story, pk=int(story_id))
    user = auth.get_user(request)
    if user != story.user:
        return HttpResponse('Unauthorized', status=401)

    form = UploadFileForm(request.POST, request.FILES)
    if form.is_valid():
        img = request.FILES['file']
        pic = Picture.objects.create(story=story)
        pic.save_in_sizes(img)
        return HttpResponse(pic.id)
    else:
        return HttpResponse('Sorry, your data was invalid', status=400)


def story(request, story_id):
    if story_id:
        return story_contents(request, story_id, 'story.html',
                              check_published=True)
    else:
        return redirect('/')


@login_required
@ensure_csrf_cookie
def edit(request, story_id):
    '''
    Edit page view.
    '''
    return story_contents(request, story_id, 'edit.html', check_user=True)


@login_required
def user_stories(request):
    """
    Shows list of user stories and link to create new story.
    """
    user = auth.get_user(request)
    stories = Story.objects.filter(user=user)
    context = {'stories': stories}
    return render(request, 'my_stories.html', context)


def show_story_near_by_page(request):
    """
    Search stories near by page
    """
    try_activate_user_language(request)
    args={}
    args.update(csrf(request))
    args['item_type']='story'
    return render(request, "items_near_by.html", args)


def show_picture_near_by_page(request):
    """
    Search pictures near by page
    """
    try_activate_user_language(request)
    args={}
    args.update(csrf(request))
    args['item_type']='picture'
    return render(request, "items_near_by.html", args)


def my_news(request):
    """
    Shows a page with latest publications of my subscriptions
    """
    user = auth.get_user(request)
    user_subscriptions = Subscriptions.objects.filter(subscriber=user)
    exception = None
    stories = []

    if user_subscriptions:
        for subscription in user_subscriptions:
            for story in Story.objects.filter(user=subscription.subscription):
                stories.append(story)
        if not stories:
            exception = "No stories"
    else:
        exception = "You have no subscriptions"

    context = {'stories': stories, 'exception': exception}
    return render(request, 'my_news.html', context)

def get_story_list(request):
    if request.is_ajax():
        """
        Get coordinates of map.
        """
        request_body = json.loads(request.body)
        coordinates=request_body["coordinates"]
        left_border=float(coordinates['va']['k'])
        right_border=float(coordinates['va']['j'])
        bottom_border=float(coordinates['Ca']['k'])
        top_border=float(coordinates['Ca']['j']) 
        """
        Filter story.
        """  
        story_list=[]
        stories = Story.objects.filter(published=True)
        for story in stories:
            if story.get_coordinates():
                story_lng=float(story.get_coordinates()[u"marker"][u"lng"])
                story_lat=float(story.get_coordinates()[u"marker"][u"lat"])
                if (story_lng>right_border) and (story_lng<left_border):
                    if (story_lat<top_border) and (story_lat>bottom_border):                       
                        """
                        Append dictionary of story into story_list.
                        """ 
                        story_list.append(story.convert_to_dict())                  
        """
        Response story_list converted into JSON.
        """    
        JSON_story_list=json.dumps(story_list, ensure_ascii=False)
    return HttpResponse(JSON_story_list)

def get_picture_list(request):
    if request.is_ajax():
        """
        Get coordinates of map.
        """
        request_body = json.loads(request.body)
        coordinates=request_body["coordinates"]
        left_border=float(coordinates['va']['k'])
        right_border=float(coordinates['va']['j'])
        bottom_border=float(coordinates['Ca']['k'])
        top_border=float(coordinates['Ca']['j'])
        """
        Filter picture.
        """  
        picture_list=[]
        pictures=Picture.objects.all()
        for picture in pictures:
            story=Story.objects.get(id=picture.story_id)
            if story.published:               
                if picture.latitude and picture.longitude:
                    if (picture.longitude>right_border) and (picture.longitude<left_border):
                        if (picture.latitude<top_border) and (picture.latitude>bottom_border):               
                            """
                            Append dictionary of picture into picture_list.
                            """ 
                            picture_list.append(picture.convert_to_dict())
        """
        Response story_list converted into JSON.
        """            
        JSON_picture_list=json.dumps(picture_list, ensure_ascii=False)
    return HttpResponse(JSON_picture_list)


@login_required
@require_POST
def like(request, item_id, item_to_like):
    item = get_object_or_404(
        globals()[item_to_like.capitalize()],
        pk=int(item_id)
    )
    user = auth.get_user(request)
    if item.is_liked_by(user):
        item.likes.remove(user)
    else:
        item.likes.add(user)
    item.save()
    return HttpResponse(item.likes_count())


@login_required
@require_POST
def delete(request, story_id):
    story = get_object_or_404(Story, pk=int(story_id))
    user = auth.get_user(request)
    if user != story.user:
        return HttpResponse('Unathorized', status=401)
    story.delete()
    return redirect(reverse('user_stories'))


def delete_story_tag(request):
    """
    Delete teg in story tags
    """
    print 'delete story igor 1', request
    if request.is_ajax():
        story_id = request.GET.get('Story_id')
        tag_poz = request.GET.get('Tag_position')
        print 'delete story igor 2', story_id, tag_poz
        story = Story.objects.get(pk=story_id)
        story.tags.all()[int(tag_poz)].delete()
        return HttpResponse(status=200)


def get_story_tags(request):
    """
    Get tags from story
    """
    tags_data = []
    if request.is_ajax():
        story_id = request.GET.get('Story_id')
        story = Story.objects.get(pk=story_id)

        for tag in story.tags.all():
            tags_data.append({"name": str(tag), "datetime": str(
                tag.datetime)})

        return HttpResponse(json.dumps(tags_data))


@ensure_csrf_cookie
def get_story_content(request):
    """
    Get text from story
    """
    if request.is_ajax():
        story_id = request.GET.get('id')
        story = Story.objects.get(pk=int(story_id))
        pictures = Picture.objects.filter(story_id=int(story_id))
        picture_dic = {}
        for picture in pictures:
            picture_dic[str(picture.id)] = str(picture.get_stored_pic_by_size(
                800))

        content = {"text": str(story.text), "title": str(story.title),
                   "datetime": str(story.date_publish),
                   "picture": picture_dic}

        return HttpResponse(json.dumps(content))
        # return HttpResponse(status=200)
    else:
        return HttpResponse("REQUEST ERROR")


@login_required
@require_POST
def put_tag(request):
    """
    Put curent tag to DB
    """
    if request.is_ajax():
        request_body = json.loads(request.body)
        tags = Tag.objects.filter(name=request_body['tag_name'])
        if not tags:
            tag = Tag()
            tag.name = request_body['tag_name']
            tag.save()
        else:
            tag = tags[0]
        story = Story.objects.get(pk=int(request_body['story_id']))
        story.tags.add(tag)
        story.save()
        return HttpResponse(status=200)


def show_authorization_page(request):
    return render(
        request, 'authorization_page.html')


def stories_by_user(request):
    stor = csrf(request)
    if request.method == 'GET':
        needed_user = str(request.GET.get('needed_user', ''))
        stories = []
        if needed_user:
            needed_user = User.objects.get(username=needed_user)
            stories = Story.objects.filter(user=needed_user)
        context = {'stories': stories}
        return render(request, 'stories_by_user.html', context)


def check_connection(request):
    return HttpResponse(status=200)


def settings(request):
    try_activate_user_language(request)
    args={}
    args.update(csrf(request))
    if request.user.is_authenticated():    
        args['user']=request.user
    current_language=get_language_info(request.LANGUAGE_CODE)
    args['current_language']=current_language
    another_language=[]
    for lang in TripJournal_settings.LANGUAGES:
        if lang[0] != request.LANGUAGE_CODE:
            another_language.append(get_language_info(lang[0]))
    args['another_language']=another_language
    return render(request, "settings.html", args)


def logout(request):
    auth.logout(request)
    request.session[translation.LANGUAGE_SESSION_KEY] =''
    return redirect('/')


@login_required
@require_POST
def make_subscription_or_unsubscribe(request, subscribe_on):
    user = auth.get_user(request)
    author = User.objects.get(id=int(subscribe_on))
    action = request.POST.get('action')

    if action == "subscribe":
        if not Subscriptions.objects.filter(subscriber=user.id,
                                            subscription=author.id):
            Subscriptions(subscriber=user, subscription=author).save()
        return HttpResponse(status=200)
    else:
        if Subscriptions.objects.filter(subscriber=user.id,
                                        subscription=author.id):
            Subscriptions.objects.filter(
                subscriber=user.id, subscription=author.id).delete()
        return HttpResponse(status=200)


def general_rss(request):
    date = datetime.datetime.now().date()
    yesterday = date - datetime.timedelta(days=1)
    stories = Story.objects.filter(date_publish__gt=yesterday).order_by("-date_publish")
    context = {'stories': stories, 'date': date}
    return render(request, 'rss.xml', context,
                  content_type="application/xhtml+xml")


