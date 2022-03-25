# word-complexity-prototype

**How to run**
app:
- Open Chrome extension settings, turn on developer mode, select "Load Unpacked", navigate to \word-complexity-prototype\ and select app

api:
- If django is set up and activated, navigate to \word-complexity-prototype\api and run 'python manage.py runserver'
- To set up django:
  - From \word-complexity-prototype, run 'virtualenv thanos -p python' (need to have virualenv installed with pip) to create the vitual environment if it hasn't been created
	- To activate the virtual environment, run 'source thanos/bin/activate'
		- You might need to install some dependencies for django and the api
			- djangorestframework
			- django-cors-headers

\* *note that, depending on your setup, you might need to type "python3" instead of "python" when typing the commands above*
