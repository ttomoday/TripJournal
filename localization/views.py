from django.shortcuts import  redirect, render_to_response
from django.contrib import auth
from django.utils.translation import activate
from django.utils import translation

# Create your views here.
def change_language(request):
    if request.method=="POST":
        lan=request.POST.get("language",'en')
        activate(lan)
        if request.user.is_authenticated():
            user=request.user
            profile=user.profile
            profile.user_language=lan
            profile.save()
        request.session[translation.LANGUAGE_SESSION_KEY] = lan
    return redirect('/settings/')

