'use strict';

var reg;
var sub;
var isSubscribed = false;
var subscribeButton = document.querySelector('button');

if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported');
    navigator.serviceWorker.register('sw.js')
        .then(initialiseState)
        .catch(function(error) {
            console.log('Service Worker Error :', error);
        });
} else {
    console.warn('Service workers aren\'t supported in this browser.');
}

function initialiseState() {
    // Are Notifications supported in the service worker?
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn('Notifications aren\'t supported.');
        return;
    }

    // Check the current Notification permission.
    // If its denied, it's a permanent block until the
    // user changes the permission
    if (Notification.permission === 'denied') {
        console.warn('The user has blocked notifications.');
        return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
        console.warn('Push messaging isn\'t supported.');
        return;
    }

    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        reg = serviceWorkerRegistration;
        console.log('Service Worker is ready :^)', reg);
        subscribeButton.disabled = false;
        // Do we already have a push message subscription?
        serviceWorkerRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                // Enable any UI which subscribes / unsubscribes from
                // push messages.

                if (!subscription) {
                    // We aren't subscribed to push, so set UI
                    // to allow the user to enable push
                    subscribeButton.textContent = 'Subscribe';
                    isSubscribed = false;
                    return;
                }

                // Keep your server in sync with the latest subscriptionId
                sendSubscriptionToServer(subscription);

                // Set your UI to show they have subscribed for
                // push messages
                subscribeButton.textContent = 'Unsubscribe';
                isSubscribed = true;
            })
            .catch(function(err) {
                console.warn('Error during getSubscription()', err);
            });
    });
}

subscribeButton.addEventListener('click', function() {
    if (isSubscribed) {
        unsubscribe();
    } else {
        subscribe();
    }
});

function subscribe() {
    // Disable the button so it can't be changed while
    // we process the permission request
    subscribeButton.disabled = true;

    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true
            })
            .then(function(subscription) {
                // The subscription was successful
                sub = subscription;
                isSubscribed = true;
                subscribeButton.textContent = 'Unsubscribe';
                subscribeButton.disabled = false;
                console.log('Subscribed! Endpoint:', subscription.endpoint);
                // TODO: Send the subscription.endpoint to your server
                // and save it to send a push message at a later date
                //return sendSubscriptionToServer(subscription);
            })
            .catch(function(e) {
                if (Notification.permission === 'denied') {
                    // The user denied the notification permission which
                    // means we failed to subscribe and the user will need
                    // to manually change the notification permission to
                    // subscribe to push messages
                    console.warn('Permission for Notifications was denied');
                    subscribeButton.disabled = true;
                } else {
                    // A problem occurred with the subscription; common reasons
                    // include network errors, and lacking gcm_sender_id and/or
                    // gcm_user_visible_only in the manifest.
                    console.error('Unable to subscribe to push.', e);
                    subscribeButton.disabled = false;
                    subscribeButton.textContent = 'Subscribe';
                }
            });
    });
}

// function subscribe() {
//     reg.pushManager.subscribe({
//         userVisibleOnly: true
//     }).
//     then(function(pushSubscription) {
//         sub = pushSubscription;
//         console.log('Subscribed! Endpoint:', sub.endpoint);
//         subscribeButton.textContent = 'Unsubscribe';
//         isSubscribed = true;
//     }).catch(function(error) {
//         console.log('Subscribe Error :', error);
//     });
// }

function unsubscribe() {
    sub.unsubscribe().then(function(event) {
        subscribeButton.textContent = 'Subscribe';
        console.log('Unsubscribed!', event);
        isSubscribed = false;
    }).catch(function(error) {
        console.log('Error unsubscribing', error);
        subscribeButton.textContent = 'Subscribe';
    });
}
