blkUI.directive('blockUi', function (blockUiCompileFn) {

  return {
    scope: true,
    restrict: 'A',
    compile: blockUiCompileFn
  };

}).factory('blockUiCompileFn', function (blockUiPreLinkFn, blockUIConfig, $compile) {

  return function ($element, $attrs) {
    
    // If the element does not have the class "block-ui" set, we set the
    // default css classes from the config.

    if (!$element.hasClass('block-ui')) {
      $element.addClass(blockUIConfig.cssClass);
    }
    
    // Class should be added here to prevent an animation delay error.

    $element.append('<div block-ui-container class="block-ui-container"></div>');

    return {
      pre: blockUiPreLinkFn
    };

  };

}).factory('blockUiPreLinkFn', function (blockUI, blockUIUtils, blockUIConfig, $rootScope, blockUiAnimateLinkFn) {

  function link($scope, $element, $attrs) {

    // Create the blockUI instance
    // Prefix underscore to prevent integers:
    // https://github.com/McNull/angular-block-ui/pull/8

    var instanceId = $attrs.blockUi || '_' + $scope.$id;
    var srvInstance = blockUI.instances.get(instanceId);
    // If this is the main (topmost) block element we'll also need to block any
    // location changes while the block is active.

    if (instanceId === 'main') {
      blockNavigation($scope, srvInstance, blockUIConfig);
    } else {
      // Locate the parent blockUI instance
      var parentInstance = $element.inheritedData('block-ui');

      if (parentInstance) {
        // TODO: assert if parent is already set to something else
        srvInstance._parent = parentInstance;
      }
    }

    // Ensure the instance is released when the scope is destroyed

    $scope.$on('$destroy', function () {
      srvInstance.release();
    });

    // Increase the reference count

    srvInstance.addRef();

    // Expose the state on the scope

    $scope.$_blockUiState = srvInstance.state();

    $scope.$watch('$_blockUiState.blocking', function (value, prevValue) {
      // Set the aria-busy attribute if needed
      $element.attr('aria-busy', !!value);
      $element.toggleClass('block-ui-visible', !!value);

      // if (value !== prevValue) {
        
      //   var event = 'block-ui-visible-' + (value ? 'start' : 'end');

      //   // TODO: Wrong place -- move to instance
        
      //   $rootScope.$broadcast(event, {
      //     instance: srvInstance,
      //     element: $element
      //   });
      // }

    });

    $scope.$watch('$_blockUiState.blockCount > 0', function (value, prevValue) {
      $element.toggleClass('block-ui-active', !!value);

      // if (value !== prevValue) {
      //   var event = 'block-ui-active-' + (value ? 'start' : 'end');

      //   $rootScope.$broadcast(event, {
      //     instance: srvInstance,
      //     element: $element
      //   });
      // }
    });

    // If a pattern is provided assign it to the state

    var pattern = $attrs.blockUiPattern;

    if (pattern) {
      var regExp = blockUIUtils.buildRegExp(pattern);
      srvInstance.pattern(regExp);
    }

    // Store a reference to the service instance on the element

    $element.data('block-ui', srvInstance);

    // Setup animation support
    
    var animateAttr = $element.attr('block-ui-animate');
    
    if ($element.hasClass('block-ui-animate') || animateAttr !== undefined) {
      $element.attr('block-ui-animate', animateAttr || 'true');
      blockUiAnimateLinkFn($scope, $element, $attrs);
    }

  }

  return link;

});
