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
app.controller ('MainCtrl',['$scope','posts',
  function($scope,posts)
  {
    $scope.posts=posts.posts;

    $scope.addPost = function ()
    {
      if(!$scope.title || $scope.title ===''){return;}
      $scope.posts.push({
        title: $scope.title,
        link: $scope.link,
        upvotes:0,
        comments:[]
      });
      $scope.title='';
      $scope.link='';
    };

    $scope.incrementUpvotes=function(post)
    {
      // console.log('In incrementUpvotes post Object:',post);  voegt een log toe, je kan er controles in steken
      post.upvotes+=1;
    }
  }]);

/*
By Angular conventions, lowerCamelCase is used for factory names that won't be new'ed.
You may be wondering why we're using the keyword factory instead of service. 
In angular, factory and service are related in that they are both instances of a third entity called provider.
*/

app.factory('posts',[function()
  {
    var postFactory=
    {
      posts:[]

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
app.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider,$urlRouterProvider)
  {
    $stateProvider.state('home',{
      url:'/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
    })
    .state('posts',{
      url:'/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostCtrl'
    });

    $urlRouterProvider.otherwise('home');

  }]
);

//We can use $stateParams to retrieve the id from the URL and load the appropriate post.
app.controller('PostCtrl',['$scope','$stateParams','posts',
  function($scope,$stateParams,posts)
  {
    $scope.post=posts.posts[$stateParams.id];

    $scope.addComment=function()
    {
      if($scope.body === ''){return;}
      $scope.post.comments.push({
        author:'user',
        body:$scope.body,
        upvotes:0
      });
      $scope.body='';
    };
  }]
);
