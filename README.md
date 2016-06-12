# CrowdSprout

CrowdSprout is a crowd based seed generator built on Nodejs and Socket.io.

### Demo 
* https://crowdsprout.herokuapp.com/
* https://crowdsprout.herokuapp.com/api/seed

### Installation


Make sure to set the url and port where you plan to run the server in the script.js file within the /static/assets/scripts folder.

In our case it is 127.0.0.1:3700 when running locally.

```
var socket = io.connect('http://127.0.0.1:3700');
```
 Notice the port which can be changed in the index.js. It is currently set to use Heroku ports if the PORT environment variable is set, or else default to 3700.

Install dependencies
```sh
$ cd projectroot
$ npm install
```

Run server
```sh
$ node index.js
```

If successful you can browse http://127.0.0.1:3700

* If you want console information set the NODE_ENV environment variable to development.

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Todos
 * Introduce more entropy to the data from server side
 * Add more 'activities' that users can perform on frontend to generate data


License
----
MIT
* Do what you will

