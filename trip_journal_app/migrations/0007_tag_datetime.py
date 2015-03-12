# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('trip_journal_app', '0006_auto_20150127_1537'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='datetime',
            field=models.DateTimeField(default=datetime.date(2015, 3, 12), auto_now_add=True),
            preserve_default=False,
        ),
    ]
