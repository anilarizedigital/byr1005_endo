define([
    'core/js/adapt',
    'core/js/views/componentView'
], function(Adapt, ComponentView) {

    var AccordionView = ComponentView.extend({

        itemIndex: -1,
		isAudio: false,
        shouldPauseWhenOutOfView: true,
        compID: '',

        events: {
            'inview': 'onInview',
            'click .accordion-item-title': 'onClick',
            'click .inline-button-icon': 'toggleAudio'
        },

        preRender: function() {
            this.compID = this.model.get('_id');
            this.isAudio = Adapt.config.get('_audio')._isEnabled;

            this.checkIfResetOnRevisit();

            this.model.resetActiveItems();

            this.listenTo(this.model.get('_children'), {
                'change:_isActive': this.onItemsActiveChange,
                'change:_isVisited': this.onItemsVisitedChange
            });
            this.listenTo(Adapt, ('audioplayer'+this.compID+':ended'), this.onAudioEnded);
        },

        postRender: function() {
            if(this.isAudio) {
                Adapt.audio.initialize(this.$el, this.model.get('_id'));
            }

            this.setReadyStatus();

            if (this.model.get('_setCompletionOn') === 'inview') {
                this.setupInviewCompletion();
            }
        },

        onAudioEnded: function() {
            console.log("audio is finished");
            this.$('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
        },

        toggleAudio: function(event) {
            event.preventDefault();

            var index = parseFloat($(event.currentTarget).attr('data-id'));
            if($(event.currentTarget).hasClass('icon-volume-high')) {
                this.$el.find('.global-audio-player audio').attr('src', '');
                $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
                // $(event.currentTarget).removeClass('icon-volume-high').addClass('icon-volume-mute');
            } else {
                if(this.model.get('_items')[index].hasOwnProperty('_audio')){
                this.$el.find('.global-audio-player audio').attr('src', '');
                this.playAudio(index);
                $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
                $(event.currentTarget).removeClass('icon-volume-mute').addClass('icon-volume-high');
                }
            }
        },

        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) {
                this.model.reset(isResetOnRevisit);
            }
        },

        onClick: function(event) {
            event.preventDefault();

            var index = $(event.currentTarget).parent().data('index');
            this.itemIndex = index;
            this.model.toggleItemsState(index);

            var _blockID = this.model.get("_parentId");
            
            if($(event.currentTarget).hasClass("selected")) {
                $('.'+_blockID).removeClass (function (index, className) {
                    return (className.match (/\bblind-\S+/g) || []).join(' ');
                }).addClass('blind blind-'+index);
                $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
                this.$('.inline-button-icon').filter('[data-id="'+index+'"]').removeClass('icon-volume-mute').addClass('icon-volume-high');
                this.playAudio(index);
            } else {
                $('.'+_blockID).removeClass (function (index, className) {
                    return (className.match (/\bblind-\S+/g) || []).join(' ');
                }).removeClass('blind');
                this.itemIndex = -1;
            }
        },

        onItemsActiveChange: function(item, isActive) {
            this.toggleItem(item, isActive);
        },

        onItemsVisitedChange: function(item, isVisited) {
            if (!isVisited) return;

            var $item = this.getItemElement(item);

            $item.children('.accordion-item-title').addClass('visited');
        },

        toggleItem: function(item, shouldExpand) {
            var $item = this.getItemElement(item);
            var $body = $item.children('.accordion-item-body').stop(true, true);

            $item.children('.accordion-item-title')
                .toggleClass('selected', shouldExpand)
                .attr('aria-expanded', shouldExpand);
            $item.find('.accordion-item-title-icon')
                .toggleClass('icon-plus', !shouldExpand)
                .toggleClass('icon-minus', shouldExpand);

            if (!shouldExpand) {
                this.$el.find('.global-audio-player audio').attr('src', '');
                $body.slideUp(this.model.get('_toggleSpeed'));
                return;
            }
            $body.slideDown(this.model.get('_toggleSpeed'));
        },

        getItemElement: function(item) {
            var index = item.get('_index');

            return this.$('.accordion-item').filter('[data-index="' + index +'"]');
        },

        playAudio: function(index) {
            console.log('playAudio, index: ', index);
            if(this.isAudio) {
                var currentAudio = '';
                if(this.model.get('_items')[index].hasOwnProperty('_audio')){
                    if(this.model.get('_items')[index]._audio.hasOwnProperty('src')){
                        currentAudio = this.model.get('_items')[index]._audio.src;
                    }
                }

                console.log("playAudio, this.$el.parents().find('.global-audio-player audio') ", this.$el.parents().find('.global-audio-player audio'));
                this.$el.parents().find('.global-audio-player audio').attr('src', '');
                if(currentAudio && currentAudio !='') this.$el.find('.global-audio-player audio').attr('src', currentAudio);
            }
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
            if(visible) {
                this.shouldPauseWhenOutOfView = true;
            } else {
                if(this.shouldPauseWhenOutOfView) {
                    this.shouldPauseWhenOutOfView = false;
                    this.$el.find('.global-audio-player audio').attr('src', '');
                    this.$('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
                }
            }
        }
    });

    return AccordionView;

});
