import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import GeotabPage from './components/Geotabpage.js'
import injectTapEventPlugin from 'react-tap-event-plugin';
window.timeCard = {};
window.geotab.addin.timeCard = function (api, state) {
    let timeCard = window.timeCard;
    timeCard.api = api;
    timeCard.state = state;
    return {
        initialize: function (api, state, callback) {
            //Needed for onTouchTap
            //Can go away when react 1.0 release
            injectTapEventPlugin();

            timeCard.element = document.getElementById('timeCard');
            api.getSession((cred, server) => {
                timeCard.cred = cred;
                console.log(cred, server);
                timeCard.main = render(<GeotabPage />, timeCard.element, callback);
            })

        },
        focus: function () {
            api.getSession(cred => {
                timeCard.cred = cred;
                let groups = state.getGroupFilter();
                console.log("focus called", groups);
                timeCard.main = render(<GeotabPage groups = {groups}/>, timeCard.element);

            })
        },
        blur: function () {
            unmountComponentAtNode(timeCard.element);
        }
    };
};











