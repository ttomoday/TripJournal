from django.shortcuts import  redirect, render_to_response
from django.contrib import auth
from django.utils import translation

# Create your views here.
def change_language(request):
    if request.method=="POST":
        lan=request.POST.get("language",'en')
        translation.activate(lan)
        if request.user.is_authenticated():
            user=request.user
            profile=user.profile
            profile.user_language=lan
            profile.save()
        request.session[translation.LANGUAGE_SESSION_KEY] = lan
    return redirect('/settings/')


def try_activate_user_language(request):
    if request.user.is_authenticated():
        user=request.user
        profile=user.profile
        if profile.user_language:
            lang=profile.user_language
            if lang != request.LANGUAGE_CODE:
                translation.activate(lang)
                request.session[translation.LANGUAGE_SESSION_KEY] = lang
            