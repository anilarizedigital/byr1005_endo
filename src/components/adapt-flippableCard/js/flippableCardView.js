define([
  'core/js/adapt',
  'core/js/views/componentView'
], function(Adapt, ComponentView) {

  var FlippableCardView = ComponentView.extend({

    isAudio: false,
    shouldPauseWhenOutOfView: true,
    compID: '',

    events: {
      'inview': 'onInview',
      "click .card": "onCardClick",
      "click .show-more-btn": "onShowMoreClick",
      'click .inline-button-icon': 'toggleAudio'
    },

    preRender: function() {
      this.compID = this.model.get('_id');
      this.isAudio = Adapt.config.get('_audio')._isEnabled;
      this.model.set("_stage", -1);
      this.listenTo(Adapt, 'device:resize', this.onDeviceResize);
      this.listenTo(Adapt, ('audioplayer'+this.compID+':ended'), this.onAudioEnded);

      this.model.calculateRatio();
      this._colSize = this.model.getColumnLayout(Adapt.device.screenSize);
      this.$el.addClass(this._colSize);

      _.bindAll(this, "onImageReady");
    },

    postRender: function() {
      if(this.isAudio) {
        Adapt.audio.initialize(this.$el, this.model.get('_id'));
      }
      this.$('.item-label').a11y_cntrl(false);
      this.$('.component-widget').imageready(this.onImageReady);
      this.$backFaces = this.$('.back');
      this.$cards = this.$('.card');
      this.checkTextOverlapp();
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

    checkIfResetOnRevisit: function() {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');
      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    },

    onImageReady: function() {
      this.setReadyStatus();
    },

    onCardClick: function(event) {
      event.preventDefault();

      var $elm = $(event.currentTarget);
      $elm.toggleClass('applyflip').addClass('visited');
      //$elm ('.card-content').toggleClass('flipCardBlue')
      //$('.card .card-content').toggleClass('flipCardBlue');
      var index = $elm.data('item');
      //$('.card:first-child').toggleClass('flipCardBlue');
      
      var item = this.model.getItem(index);
      if (item._isActive === true) {
        this.$('.inline-button-icon').filter('[data-id="'+index+'"]').addClass('hidden');
        this.$el.find('.global-audio-player audio').attr('src', '');
        this.model.setItemInactive(index);
        this.ctrlFocus(index);
      } else {
        this.$('.inline-button-icon').filter('[data-id="'+index+'"]').removeClass('hidden');
        this.model.setItemActive(index);
        this.ctrlFocus(index);
        $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
        this.$('.inline-button-icon').filter('[data-id="'+index+'"]').removeClass('icon-volume-mute').addClass('icon-volume-high');
        this.playAudio(index);
      }

      this.model.setItemVisited(index);
      this.model.checkCompletionStatus();
    },

    ctrlFocus: function(index) {
      var item = this.model.getItem(index),
        card = this.$cards.eq(index);
      if (item._isActive) {
        card.find('.title-inner, .body-inner').a11y_cntrl(!item._isOverlapping);
        card.find('.show-more-btn').a11y_cntrl(item._isOverlapping);
      } else {
        card.find('.title-inner, .body-inner, .show-more-btn').a11y_cntrl(false);
      }
    },

    onShowMoreClick: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var index = $(event.currentTarget).data('item');
      var item = this.model.getItem(index);
      
      Adapt.trigger('notify:popup', {
        title: item.title,
        body: item.body
      });
    },

    checkTextOverlapp: function() {
      var items = this.model.get('_items');
      for (var i = 0; i < this.$backFaces.length; i++) {
        var item = this.$backFaces[i];
        var isOverlapping = (item.scrollHeight > item.offsetHeight);
        $(item).toggleClass('overlap', isOverlapping);
        items[i]._isOverlapping = isOverlapping;
        this.ctrlFocus(i);
      }
    },

    onDeviceResize: function() {
      // handle col-sizes
      var colSize = this.model.getColumnLayout(Adapt.device.screenSize);
      if (colSize != this._colSize) {
        this.$el.removeClass(this._colSize).addClass(colSize);
        this._colSize = colSize;
      }
      this.checkTextOverlapp();
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

	return FlippableCardView;

});