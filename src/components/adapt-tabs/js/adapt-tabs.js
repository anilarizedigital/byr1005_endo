define([
  'core/js/adapt',
  'core/js/views/componentView'
], function(Adapt, ComponentView) {

  var Tabs = ComponentView.extend({

    audioPlayer: '',
    isAudio: false,
    // isAudioPlaying: false,
    isFirstTime: true,
    shouldPauseWhenOutOfView: true,

    events: {
      // 'inview': 'onInview',
      'click .tabs-navigation-item': 'onTabItemClicked',
      'click .inline-button-icon': 'toggleAudio'
    },

    onAudioEnded: function() {
      console.log("audio is finished");
      this.$('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
    },

    preRender: function() {
      this.isAudio = Adapt.config.get('_audio')._isEnabled;
      this.listenTo(Adapt, 'audioplayer:ended', this.onAudioEnded);
    },

    postRender: function() {
      if(this.isAudio) {
        Adapt.audio.initialize(this.$el, this.model.get('_id'));
      }
      this.setReadyStatus();
      this.setLayout();
      this.listenTo(Adapt, 'device:resize', this.setLayout);
      this.showContentItemAtIndex(0, true);
      this.setTabSelectedAtIndex(0);
    },

    setLayout: function() {
      this.$el.removeClass("tab-layout-left tab-layout-top");
      //if (Adapt.device.screenSize == 'large') {
        var tabLayout = this.model.get('_tabLayout');
        this.$el.addClass("tab-layout-" + tabLayout);
        if (tabLayout === 'top') {
          this.setTabLayoutTop();
          return;
        }	
        this.setTabLayoutLeft();
      /* } else {
        this.$el.addClass("tab-layout-left");
        this.setTabLayoutLeft();
      } */
    },

    setTabLayoutTop: function() {
      var itemsLength = this.model.get('_items').length;
      var itemWidth = 100 / itemsLength;
      if($(window).width() > 768) {
        itemWidth = 33.3 //100 / itemsLength - 5;
      }
      this.$('.tabs-navigation-item').css({
        width: itemWidth + '%'
      });
    },

    setTabLayoutLeft: function() {
      this.$('.tabs-navigation-item').css({
        width: 100 + '%'
      });
    },

    onTabItemClicked: function(event) {
      event.preventDefault();
      var index = $(event.currentTarget).index();
      this.showContentItemAtIndex(index);
      this.setTabSelectedAtIndex(index);
      this.setVisited($(event.currentTarget).index());
      $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
      this.$el.parents().find('.global-audio-player audio').attr('src', '');
    },

    toggleAudio: function(event) {
      event.preventDefault();

      var index = parseFloat($(event.currentTarget).attr('data-id'));
      if($(event.currentTarget).hasClass('icon-volume-high')) {
        this.$el.parents().find('.global-audio-player audio').attr('src', '');
        $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
        // $(event.currentTarget).removeClass('icon-volume-high').addClass('icon-volume-mute');
      } else {
        if(this.model.get('_items')[index].hasOwnProperty('_audio')){
          this.$el.parents().find('.global-audio-player audio').attr('src', '');
          this.playAudio(index);
          $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
          $(event.currentTarget).removeClass('icon-volume-mute').addClass('icon-volume-high');
        }
      }
    },

    showContentItemAtIndex: function(index, skipFocus) {
      var $contentItems = this.$('.tab-content');

      $contentItems.removeClass('active').velocity({
        opacity: 0
      }, {
        duration: 300,
        display: 'none'
      });

      var $contentItem = $contentItems.eq(index);
      $contentItem.velocity({
        opacity: 1
      }, {
        duration: 300,
        display: 'block',
        complete: _.bind(complete,this)
      });

      function complete() {
        if (skipFocus) return;
        $contentItem.addClass('active').a11y_focus();
      }
    },

    setTabSelectedAtIndex: function(index) {
      var $navigationItem = this.$('.tabs-navigation-item-inner');
      $navigationItem.removeClass('selected').eq(index).addClass('selected visited').attr('aria-label', this.model.get("_items")[index].tabTitle + ". Visited");
      this.setVisited(index);
    },

    setVisited: function(index) {
      var item = this.model.get('_items')[index];
      item._isVisited = true;
      this.checkCompletionStatus();
    },

    getVisitedItems: function() {
      return _.filter(this.model.get('_items'), function(item) {
        return item._isVisited;
      });
    },

    checkCompletionStatus: function() {
      if (this.getVisitedItems().length === this.model.get('_items').length) {
        this.setCompletionStatus();
      }
    },

    playAudio: function(index) {
      if(this.isAudio) {
        var currentAudio = '';
        if(this.model.get('_items')[index].hasOwnProperty('_audio')){
          if(this.model.get('_items')[index]._audio.hasOwnProperty('src')){
            currentAudio = this.model.get('_items')[index]._audio.src;
            // this.isAudioPlaying = true;
          }
        }

        this.$el.parents().find('.global-audio-player audio').attr('src', '');
        this.$el.parents().find('.global-audio-player audio').attr('src', currentAudio);
      }
    }
  },{
    template: 'tabs'
  });

  Adapt.register("tabs", Tabs);

  return Tabs;
});
