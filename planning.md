


For grabbing from the HoosList API:

Base URL: https://hooslist.virginia.edu

| Endpoint | ... | Description |
| :--- | :---- | :--- |
| /Search/ | ... | For filtering courses |
| /Search/ | _SubjectSearch | Left blank, returns key/table JSON of acronym and subject name (e.g. CS, Computer Science) <br> **?s=** defines the searched acronym (returns all that contain it in the key) |
|  |  |  |
|  |  |  |





Objective is to get a display of the enrollment graph of a class, as a tab on the CoRA popup. The way to do this is via a call to the HoosList API:
https://hooslist.virginia.edu/ClassSchedule/_GetLatestClassEnrollments?termCode=xxxx&classNumber=xxxxx <br>
termCode and classNumber are always 4 and 5 digits, respectively. termCode can be pulled from the URL of the website the CoRA extension is running on, and will be "term=xxxx" somewhere within the URL. ClassNumber can be pulled from the card of the class that the CoRA button was clicked on. <br>
The API will then return data in the format of: 
<br>
[{"enrolled":1,"waitlist":0,"t":"2025-11-03T12:23:37"},{"enrolled":0,"waitlist":0,"t":"2025-11-03T14:14:07"},{"enrolled":1,"waitlist":0,"t":"2025-11-03T19:08:01"},{"enrolled":0,"waitlist":0,"t":"2025-11-03T20:11:10"},{"enrolled":1,"waitlist":0,"t":"2025-11-05T14:30:28"}
<br>
This should be turned into a small graph within a new tab on the CoRA popup, which can be moused over to see the number of people enrolled at that time. 