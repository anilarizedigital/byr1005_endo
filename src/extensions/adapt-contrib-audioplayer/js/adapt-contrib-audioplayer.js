/**
 * AudioPlayer Extension,
 * 
 */
define(function(require) {
    var _ = require('underscore'),
        Backbone = require('backbone'),
        Adapt = require('coreJS/adapt'),
        AudioPlayer = function() {};

    AudioPlayer.prototype = _.extend({
        areListenersApplied: false,
        audioElementCollection: {},
        compID: '',

        resetPlayer: function() {},

        initialize: function($targetPlayerElement, compID) {
            this.compID = compID;
            if ($targetPlayerElement) {
                $($targetPlayerElement).first().prepend("<div class='global-audio-player' aria-hidden='true'><audio id='"+compID+"' preload='auto' autoplay type='audio/mp3'/></div>");
                this.audioElementCollection[this.compID] = $($targetPlayerElement).find('audio');
                this.setupPlayer();
            }

            if(!this.areListenersApplied) {
                this.areListenersApplied = true;
                this.listenTo(Adapt, "remove", this.resetPlayer);
            }
        },

        setupPlayer: function() {
            var modelOptions = {};
            if (modelOptions.pluginPath === undefined) {
                modelOptions.pluginPath = 'assets/';
            }
            // create the player
            this.audioElementCollection[this.compID].mediaelementplayer(modelOptions);

            $(this.audioElementCollection[this.compID]).on({
                'ended': this.onMediaElementEnded,
                'play': this.onMediaElementPlay,
                'pause': this.onMediaElementPause,
            })
        },

        onMediaElementEnded: function(event) {
            var playerID = $(event.target).attr('id');
            Adapt.trigger("audioplayer"+playerID+":ended");
        },

        onMediaElementPlay: function() {
            var playerID = $(event.target).attr('id');
            Adapt.trigger("audioplayer"+playerID+":playing");
        },

        onMediaElementPause: function() {
            var playerID = $(event.target).attr('id');
            Adapt.trigger("audioplayer"+playerID+":stopped");
        }
    }, Backbone.Events);

    Adapt.on("app:dataReady", function() {
        //var isMenuPreRendered = false;
        var _config = Adapt.config.get("_audio");
        if (!_config || !_config._isEnabled) return;
        console.log("AudioPlayer data ready");
        Adapt.audio = new AudioPlayer();

        Adapt.on("pageView:ready", function(){
            console.log('audioplayer, pageView:ready');
        });
        Adapt.on("menuView:ready", function(view){
            console.log('audioplayer, menuView:ready');
        });
        Adapt.on("pageView:postRender", function(view) {
            console.log('pageView:postRender');
        });
        Adapt.on("menuView:postRender", function(view) {
            console.log('menuView:postRender');
        });
    });
})