var app= angular.module('flapperNews',['ui.router']);
// altgr + 5 voor []

/*
 The $scope variable serves as the bridge between Angular controllers and Angular templates. 
 If you want something to be accessible in the template such as a function or variable, bind it to 

 posts==factory injection
 
 this will add fake data (add in addPost of MainCtrl)
  $scope.posts.push({
    title: $scope.title,
    link: $scope.link,
    upvotes: 0,
    comments: [
      {author: 'Joe', body: 'Cool post!', upvotes: 0},
      {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
    ]
  });

*/

app.controller ('MainCtrl',['$scope','posts','auth',
  function($scope,posts)
  {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.posts=posts.posts;

    $scope.addPost = function ()
    {
      if(!$scope.title || $scope.title ===''){return;}
      $scope.posts.create({
        title: $scope.title,
        link: $scope.link
      });
      $scope.title='';
      $scope.link='';
    };

    $scope.incrementUpvotes=function(post)
    {
      // console.log('In incrementUpvotes post Object:',post);  voegt een log toe, je kan er controles in steken
      post.upvotes(post);
    }
  }]);

/*
By Angular conventions, lowerCamelCase is used for factory names that won't be new'ed.
You may be wondering why we're using the keyword factory instead of service. 
In angular, factory and service are related in that they are both instances of a third entity called provider.
*/

app.factory('posts',['$http', 'auth', 
  function($http, auth)
  {
    var postFactory=
    {
      posts:[]

    };
    //retrieve posts
    postFactory.getAll = function() {
      return $http.get('/posts').success(function(data){
        angular.copy(data, postFactory.posts);
      });
    };

    //create new posts
    postFactory.create = function(post) {
      return $http.post('/posts', post,{headers: {
        Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        postFactory.posts.push(data);
      });
    };

    //upvoting post
    postFactory.upvote = function(post) {
      return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        post.upvotes += 1;
      });
    };

    //get post by id
    postFactory.get = function(id) {
      return $http.get('/posts/' + id).then(function(res){
        return res.data;
      });
    };

    //add comment
    postFactory.addComment = function(id, comment) {
      return $http.post('/posts/' + id + '/comments', comment, 
        {headers: {Authorization: 'Bearer '+auth.getToken()});
    };

    //upvoting comments
    postFactory.upvoteComment = function(post, comment) {
      return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, 
        {headers: {Authorization: 'Bearer '+auth.getToken()}}))
        .success(function(data){
          comment.upvotes += 1;
        });
    };

    return postFactory;

  }]);


/*
Here we set up our home route. You'll notice that the state is given a name ('home'),
URL ('/home'), and template URL ('/home.html'). We've also told Angular that our new 
state should be controlled by MainCtrl. Finally, using the otherwise() method we've 
specified what should happen if the app receives a URL that is not defined. 
All that's left to do is define the home.html template. Instead of creating a new file, 
we are going to move most of our HTML into an inline template.
*/
app.config(['$stateProvider', '$urlRouterProvider',
 function($stateProvider,$urlRouterProvider)
  {
    $stateProvider.state('home',{
      url:'/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
      resolve: {
          postPromise: ['posts', function(posts){
            return posts.getAll();
          }]
        }
    })
    .state('posts',{
      url:'/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostCtrl'
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });    

    $urlRouterProvider.otherwise('home');

  }]
);

//We can use $stateParams to retrieve the id from the URL and load the appropriate post.
app.controller('PostCtrl',['$scope','posts','post','auth',
  function($scope,posts,post)
  {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.post=post;
    
    $scope.addComment = function(){
      if($scope.body === '') { return; }
      posts.addComment(post._id, {
        body: $scope.body,
        author: 'user'})
      .success(function(comment) {
        $scope.post.comments.push(comment);
      });
      $scope.body = '';
    };
    $scope.incrementUpvotes = function(comment){
      posts.upvoteComment(post, comment);
    };    
  }]
);

//Create authentication factory
app.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};

  auth.saveToken = function (token){
    $window.localStorage['flapper-news-token'] = token;
  };

  auth.getToken = function (){
    return $window.localStorage['flapper-news-token'];
  }

  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };

  return auth;
  }]
);

//controller for login & register
app..controller('AuthCtrl', ['$scope', '$state','auth',
  function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };

    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };
  }]
);

//controller for navigation
app.controller('NavCtrl', ['$scope', 'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
  }]
);