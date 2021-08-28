define(function(require) {

  var ComponentView = require('coreViews/componentView');
  var Adapt = require('coreJS/adapt');

  var StackList = ComponentView.extend({

    TRANSITION_TIME: 250,
    TRIGGERED: false,

    isAudio: false,
    shouldPauseWhenOutOfView: true,
    compID: '',

    events: {
      'inview': 'onInview',
      "click .stacklist-next": "nextItem",
      'click .inline-button-icon': 'toggleAudio'
    },

    onAudioEnded: function() {
      console.log("audio is finished");
      this.$('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
    },

    preRender: function() {
      this.compID = this.model.get('_id');
      this.isAudio = Adapt.config.get('_audio')._isEnabled;
      this.listenTo(Adapt, {
        'device:resize': this.onScreenSizeChanged,
        'device:changed': this.onScreenSizeChanged
      });
      this.listenTo(Adapt, ('audioplayer'+this.compID+':ended'), this.onAudioEnded);
      this.model.set("_globals", Adapt.course.get("_globals"));
      this.model.set("_stage", -1);
      this.setupButton();
    },

    postRender: function() {
      if(this.isAudio) {
        Adapt.audio.initialize(this.$el, this.model.get('_id'));
      }
      //if (!this.model.get("_isComplete") || this.model.get("_isResetOnRevisit")) this.setupListItems();
      this.setupListItems();
      this.setReadyStatus();
      var _this = this;
      setTimeout(function() {
        console.log('1, setTimeout');
        _this.nextItem(false);
    }, 1000);
    },

    onInview: function(event, visible, visiblePartX, visiblePartY) {
      if(visible) {
        // var areaInView = "both";
        // if($("html").hasClass("size-small")) {
        //   areaInView = "top";
        // }
        // if(visiblePartY==areaInView) {
        //   if(!this.TRIGGERED)  {
        //     this.TRIGGERED = true;
        //     this.nextItem(false);
        //   }
        // }
      } else {
        this.$el.find('.global-audio-player audio').attr('src', '');
        this.$('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
      }
    },

    toggleAudio: function(event) {
      event.preventDefault();

      var index = parseFloat($(event.currentTarget).attr('data-id'));
      console.log("toggleAudio, event.currentTarget: ", $(event.currentTarget))
      if($(event.currentTarget).hasClass('icon-volume-high')) {
        this.$el.find('.global-audio-player audio').attr('src', '');
        $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
      } else {
        if(this.model.get('_items')[index].hasOwnProperty('_audio')){
          this.$el.find('.global-audio-player audio').attr('src', '');
          this.playAudio(index);
          $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
          $(event.currentTarget).removeClass('icon-volume-mute').addClass('icon-volume-high');
        }
      }
    },

    setupButton: function() {
      var _button = this.model.get("_button") || {};
      // Set up button aria label

      var btnAriaLabel = this.model.get("_globals")._components._stacklist.ariaButtonLabel || this.model.get("_globals")._accessibility._ariaLabels.next;
      this.model.set({buttonAriaLabel: btnAriaLabel});

      if (!_button.startText) _button.startText = "";
      if (!_button.continueText) _button.continueText = "";
      if (!_button.ariaLabel) _button.ariaLabel = btnAriaLabel;

      this.model.set("_button", _button);
    },

    setupListItems: function() {

      // Set item positions alternating R and L
      var wWin = $(window).width();
      var $items = this.$(".stacklist-item");

      //$items.addClass("visibility-hidden");
      $items.css('display', 'none');

      //$items.each(function(i) {
        //var $el = $items.eq(i);
        //var even = i % 2 === 0;
        //var offset = $el.offset();
        //offset.left = even ? - ($el.outerWidth() + 10) : wWin + 10;
        //$el.offset(offset);
      // });
      this.$(".stacklist-button").show();
    },

    onScreenSizeChanged: function() {
      var currentStage = this.model.get("_stage");
      this.setStage(currentStage);
    },

    nextItem: function(addBottomMargin) {
      var bottomMargin = addBottomMargin==false ? 0 : 20;
      var stage = this.model.get("_stage") + 1;

      console.log('nextItem, stage: ', stage);

      this.setStage(stage, bottomMargin);

      if(addBottomMargin!=false) {
        $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
        this.$el.find('.global-audio-player audio').attr('src', '');
        this.playAudio(stage);
        this.$('.inline-button-icon').filter('[data-id="'+stage+'"]').removeClass('icon-volume-mute').addClass('icon-volume-high');
      }
    },

    setStage: function(stage, bottomMargin) {
      var sameStage = false;
      if(stage===this.model.get("_stage"))
        sameStage = true;

      var $item = this.$(".stacklist-item").eq(stage);
      this.$(".stacklist-item").removeClass('current');
      $item.addClass('current');
      if(!sameStage){
        this.model.set("_stage", stage);

        var continueText = this.model.get("_items")[stage].next || this.model.get("_button").continueText;
        var btnAriaLabel = this.model.get("_button").ariaLabel;
        var isComplete = this.model.get("_items").length - 1 === stage;

        if (!isComplete) {
          this.$(".stacklist-next")
          .attr("aria-label", continueText + ", " + btnAriaLabel)
          .html(continueText);
        }

        //$item.removeClass("visibility-hidden");
        $item.css('display', 'block');
        //$item.addClass("show").a11y_focus();

        if (isComplete) {
          this.onComplete()
        }
      }

      var itemHeight = $item.outerHeight(true) + bottomMargin;
      if(sameStage) {
        this.$('.visibility-hidden').css('display', 'none');
        var newH = parseInt(this.$('.stacklist-items').outerHeight(true));
        var newH1 = parseInt(this.$('.stacklist-items').innerHeight());
        console.log("stacklist-items outerHeight:", newH, ' newH1: ', newH1);
        this.$('.visibility-hidden').css('display', 'block');
        var that = this;
        //setTimeout(function() {
            this.$(".stacklist-button").css({top: (newH1+'px')});
        //}, 3000);
      } else {
        console.log("different stage, itemHeight: ", itemHeight);
        var that = this;
        //setTimeout(function() {
            that.$(".stacklist-button").velocity({top: "+=" + itemHeight}, that.TRANSITION_TIME);
        //}, 1000);
      }
    },

    onComplete: function () {
      var _this = this;
      var $button = this.$(".stacklist-button");
      $button.velocity({opacity: 0}, {
        duration: this.TRANSITION_TIME,
        queue: false,
        complete: function() {
          $button.remove();
          _this.$('.stacklist-items').css('margin-bottom', '-5px');
        }
      });

      this.setCompletionStatus();
    },

    playAudio: function(index) {
      if(this.isAudio) {
        var currentAudio = '';
        if(this.model.get('_items')[index].hasOwnProperty('_audio')){
          if(this.model.get('_items')[index]._audio.hasOwnProperty('src')){
              currentAudio = this.model.get('_items')[index]._audio.src;
          }
        }

        console.log("audio to be played is ", currentAudio);
        this.$el.parents().find('.global-audio-player audio').attr('src', '');
        if(currentAudio && currentAudio !='') this.$el.find('.global-audio-player audio').attr('src', currentAudio);
      }
    },
  });

  Adapt.register('stacklist', StackList);

  return StackList;

});
