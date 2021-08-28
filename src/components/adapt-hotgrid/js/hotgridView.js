define([
    'core/js/adapt',
    'core/js/views/componentView',
    './hotgridPopupView'
], function(Adapt, ComponentView, HotgridPopupView) {

    var HotgridView = ComponentView.extend({
      isAudio: false,
      shouldPauseWhenOutOfView: true,
      compID: '',

      events: {
        'inview': 'onInview',
        'click .hotgrid-grid-item': 'onItemClicked',
        'click .inline-button-icon': 'toggleAudio'
      },

      initialize: function() {
        ComponentView.prototype.initialize.call(this);
        this.setDeviceSize();
        this.setUpViewData();
        this.setUpModelData();
        this.setUpEventListeners();
        this.checkIfResetOnRevisit();
      },

      setUpViewData: function() {
        this.popupView = null;
        this._isPopupOpen = false;
      },

      setUpModelData: function() {
        if (this.model.get('_canCycleThroughPagination') === undefined) {
          this.model.set('_canCycleThroughPagination', false);
        }
      },

      setUpEventListeners: function() {
        this.listenTo(Adapt, 'device:changed', this.resizeControl);

        this.listenTo(this.model.get('_children'), {
          'change:_isActive': this.onItemsActiveChange,
          'change:_isVisited': this.onItemsVisitedChange
        });
        this.listenTo(Adapt, ('audioplayer'+this.compID+':ended'), this.onAudioEnded);
      },

      setDeviceSize: function() {
        if (Adapt.device.screenSize === 'large') {
          this.$el.addClass('desktop').removeClass('mobile');
          this.model.set('_isDesktop', true);
        } else {
          this.$el.addClass('mobile').removeClass('desktop');
          this.model.set('_isDesktop', false)
        }
      },

      checkIfResetOnRevisit: function() {
        var isResetOnRevisit = this.model.get('_isResetOnRevisit');

        // If reset is enabled set defaults
        if (isResetOnRevisit) this.model.reset(isResetOnRevisit);
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

      preRender: function() {
        this.compID = this.model.get('_id');
        this.isAudio = Adapt.config.get('_audio')._isEnabled;
      },

      postRender: function() {
        this.setUpColumns();
        this.$('.hotgrid-widget').imageready(this.setReadyStatus.bind(this));
        if(this.isAudio) {
          Adapt.audio.initialize(this.$el, this.compID);
        }
      },

      resizeControl: function() {
        this.setDeviceSize();
        this.render();
      },

      setUpColumns: function() {
        // var columns = this.model.get('_columns');

        // if (columns && Adapt.device.screenSize === 'large') {
        //     this.$('.hotgrid-grid-item').css('width', (100 / columns) + '%');
        // }

        var columns;

        if(typeof(this.model.get('_columns'))=="number" && Adapt.device.screenSize === 'large'){
          columns = this.model.get('_columns');
        }
        if(typeof(this.model.get('_columns'))=="object") {
          columns = this.model.get('_columns')['_'+Adapt.device.screenSize];
        }
        console.log('setUpColumns, columns: ', columns);

        if (columns) {
          this.$('.hotgrid-grid-item').css('width', (100 / columns) + '%');
        }
      },

      onItemsActiveChange: function(model, _isActive) {
        this.getItemElement(model).toggleClass('active', _isActive);
      },

      getItemElement: function(model) {
        var index = model.get('_index');
        return this.$('.hotgrid-grid-item').filter('[data-index="' + index + '"]');
      },

      onItemsVisitedChange: function(model, _isVisited) {
        if (!_isVisited) return;
        var $item = this.getItemElement(model);

        // Append the word 'visited' to the item's aria-label
        var visitedLabel = this.model.get('_globals')._accessibility._ariaLabels.visited + '.';
        $item.attr('aria-label', function(index, val) {
          return val + ' ' + visitedLabel;
        });

        $item.addClass('visited');
      },

      onItemClicked: function(event) {
        if (event) event.preventDefault();

        var item = this.model.getItem($(event.currentTarget).data('index'));
        var currentIndex = this.$(event.currentTarget).index();

        item.toggleActive(true);
        item.toggleVisited(true);

        //alert("onIyem " +currentIndex)
        //this.playAudio(currentIndex);
        if(this.model.get('_items')[currentIndex].hasOwnProperty('_audio')){
          $('.inline-button-icon').removeClass('icon-volume-high').addClass('icon-volume-mute');
          this.$('.inline-button-icon').filter('[data-id="'+currentIndex+'"]').removeClass('icon-volume-mute').addClass('icon-volume-high');
          this.playAudio(currentIndex);
        }

        var link = item.attributes._externalLink;
        console.log('onItemClicked _externalLink - ', link);
        (link !== undefined)? window.open(link,"_blank"):this.openPopup();
      },

      openPopup: function() {

        if (this._isPopupOpen) return;

        this._isPopupOpen = true;

        this.popupView = new HotgridPopupView({
          model: this.model
        });

        Adapt.trigger('notify:popup', {
          _view: this.popupView,
          _isCancellable: true,
          _showCloseButton: true,
          _closeOnBackdrop: false,
          _classes: ''
        });

        this.listenToOnce(Adapt, {
          'popup:closed': this.onPopupClosed
        });
      },

      onPopupClosed: function() {
        this.model.getActiveItem().toggleActive();
        this._isPopupOpen = false;
        this.$el.find('.global-audio-player audio').attr('src', '');
      },
      playAudio: function(index) {
        //alert('playAudio ' + index)
        if(this.isAudio) {
          var currentAudio = '';
          if(this.model.get('_items')[index].hasOwnProperty('_audio')){
            if(this.model.get('_items')[index]._audio.hasOwnProperty('src')){
              currentAudio = this.model.get('_items')[index]._audio.src;
            }
          };

          console.log("audio to be played is ", currentAudio);
          this.$el.parents().find('.global-audio-player audio').attr('src', '');
          if(currentAudio && currentAudio != '') this.$el.find('.global-audio-player audio').attr('src', currentAudio);
          //this.audioPlayer.play();
        }
      },
      onInview: function(event, visible, visiblePartX, visiblePartY) {
        console.log("onInview, visible: ", visible);
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

    return HotgridView;
});
