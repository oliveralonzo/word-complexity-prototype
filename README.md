# word-complexity-prototype

**How to run**
app:
- Open Chrome extension settings, turn on developer mode, select "Load Unpacked", navigate to \word-complexity-prototype\ and select app

Dummy site:
- Navigate to Dummy Data\Dummy Data - python -m http.server

api:
- If django is set up and activated, navigate to \word-complexity-prototype\api and run 'python manage.py runserver'
- To set up django:
  - From \word-complexity-prototype, run virtualenv thanos -p python3 (need to have virualenv installed with pip) to create the vitual environment if it hasn't been created
	- To active, run "source thanos/bin/activate"
		- You might need to install some dependencies for django and the api
			- djangorestframework
			- django-cors-headers
			- lorem_text
