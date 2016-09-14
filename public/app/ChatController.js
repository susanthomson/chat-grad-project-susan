(function() {
    var app = angular.module("ChatApp");

    app.controller("ChatController", ["$scope", "$http", "chatService", "$mdPanel",
    function($scope, $http, chatService, $mdPanel) {
        $scope.loggedIn = false;

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;

            var _mdPanel = $mdPanel;
            $scope.showProfile = function () {
                var position = _mdPanel.newPanelPosition()
                    .absolute()
                    .center();

                var config = {
                    attachTo: angular.element(document.body),
                    controller: PanelDialogCtrl,
                    controllerAs: 'ctrl',
                    disableParentScroll: false,
                    templateUrl: 'panel.tmpl.html',
                    hasBackdrop: true,
                    panelClass: 'demo-dialog-example',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    focusOnOpen: true
                };

                _mdPanel.open(config);
            };

            $scope.updateConversation = function () {
                if (chatService.activeConversationId) {
                    chatService.getConversation(chatService.activeConversationId).then(
                        function (conversation) {
                            $scope.activeConversation = conversation;
                            chatService.lastRead[conversation.id] =
                                conversation.messages[conversation.messages.length - 1].timestamp;
                        }
                    );
                } else {
                    $scope.activeConversation = undefined;
                }
            };

            setInterval($scope.updateConversation, 3000);

        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    }])
    .controller('PanelDialogCtrl', PanelDialogCtrl);

    function PanelDialogCtrl(mdPanelRef) {
        this._mdPanelRef = mdPanelRef;
    }

    PanelDialogCtrl.prototype.closeDialog = function() {
    
        var panelRef = this._mdPanelRef;

        panelRef && panelRef.close().then(function() {
            angular.element(document.querySelector('.demo-dialog-open-button')).focus();
            panelRef.destroy();
        });
    };

})();
