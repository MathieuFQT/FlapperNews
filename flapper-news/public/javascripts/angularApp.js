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

app.factory('posts',[function($http)
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
      return $http.post('/posts', post).success(function(data){
        postFactory.posts.push(data);
      });
    };
    //upvoting post
    postFactory.upvote = function(post) {
      return $http.put('/posts/' + post._id + '/upvote')
        .success(function(data){
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
      return $http.post('/posts/' + id + '/comments', comment);
    };
    //upvoting comments
    postFactory.upvoteComment = function(post, comment) {
      return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote')
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
app.config([
  '$stateProvider',
  '$urlRouterProvider',
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
    });

    $urlRouterProvider.otherwise('home');

  }]
);

//We can use $stateParams to retrieve the id from the URL and load the appropriate post.
app.controller('PostCtrl',['$scope','posts','post',
  function($scope,posts,post)
  {
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
