from django.conf.urls import patterns, include, url


from localization import views


urlpatterns = [
    url(r'^change_language/$', views.change_language),
]
