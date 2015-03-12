# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('trip_journal_app', '0006_auto_20150127_1537'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2015, 3, 10, 5, 3, 49, 23601, tzinfo=utc), auto_now_add=True),
            preserve_default=False,
        ),
    ]
