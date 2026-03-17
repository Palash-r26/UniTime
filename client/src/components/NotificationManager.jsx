import React, { useEffect, useState } from 'react';
import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Bell, X } from 'lucide-react';

const NotificationManager = () => {
    const [notification, setNotification] = useState(null);
    const [permission, setPermission] = useState('default');
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 1. Check current permission
        if (Notification.permission === 'granted') {
            setPermission('granted');
            requestToken();
        } else if (Notification.permission === 'default') {
            setShowPrompt(true);
        }
    }, []);

    const requestToken = async () => {
        try {
            const currentToken = await getToken(messaging, {
                vapidKey: 'YOUR_VAPID_KEY_HERE' // Placeholder - User needs to add this
            });
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                // In a real app, send this token to your server updateDoc logic here
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
        }
    };

    const handlePermissionRequest = async () => {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        setShowPrompt(false);
        if (perm === 'granted') {
            requestToken();
        }
    };

    // Foreground Message Listener
    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground Message received:', payload);
            setNotification({
                title: payload.notification.title,
                body: payload.notification.body
            });

            // Auto hide after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        });
        return () => unsubscribe();
    }, []);

    // UI RENDER
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">

            {/* 1. Permission Prompt */}
            {showPrompt && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-indigo-100 pointer-events-auto animate-in slide-in-from-right">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full text-indigo-600 dark:text-indigo-400">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Enable Notifications</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Get real-time updates for cancelled classes and assignments.
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => setShowPrompt(false)}
                                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={handlePermissionRequest}
                                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                                >
                                    Allow
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Notification Toast */}
            {notification && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl border-l-4 border-indigo-500 pointer-events-auto animate-in slide-in-from-right flex items-start gap-3 w-80">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{notification.body}</p>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

        </div>
    );
};

export default NotificationManager;
