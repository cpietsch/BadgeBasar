Das Netz der Zutrittsberechtigten in Bundesbern
==========

Development
-----------

Ein lokaler Server lässt sich hiermit starten und ist dann auf http://localhost:8000 verfügbar:

    make server

Deployment
----------

Um die Applikation auf S3 zu deployen, wird [s3cmd](http://s3tools.org/s3cmd) verwendet. Das Deploy-Ziel kann direkt im Makefile mit den Variablen `S3_BUCKET` und `S3_PATH` gesetzt werden. Um die aktuelle Version zu deployen:

    make deploy

s3cmd erwartet eine gültige Konfiguration im Verzeichnis ~/.s3cmd. Diese kann hiermit erstellt werden:

    s3cmd --configure
