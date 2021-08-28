
define([
  'coreJS/adapt',
  'coreViews/componentView'
], function (Adapt, ComponentView) {

  var ResponsiveIframe = ComponentView.extend({
    events: {
      'inview': 'inview',
      'click .media-inline-transcript-button': 'onToggleInlineTranscript'
    },

    preRender: function() {
      this.listenTo(Adapt, 'device:changed', this.resizeControl);

      this.checkIfResetOnRevisit();

      // Set the title of the IFRAME
      var iframeTitle = this.model.get('displayTitle') || this.model.get('title');
      this.model.set("iframeTitle", iframeTitle);
    },

    postRender: function() {
      this.setReadyStatus();
    },

    checkIfResetOnRevisit: function() {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    },

    inview: function(event, visible) {
      if (visible) {
        this.setCompletionStatus();
      }
    },

    onToggleInlineTranscript: function(event) {
      if (event) event.preventDefault();
      var $transcriptBodyContainer = this.$(".media-inline-transcript-body-container");
      var $button = this.$(".media-inline-transcript-button");
      var $buttonText = this.$(".media-inline-transcript-button .transcript-text-container");

      if ($transcriptBodyContainer.hasClass("inline-transcript-open")) {
          $transcriptBodyContainer.stop(true,true).slideUp(function() {
              $(window).resize();
          });
          $button.attr('aria-expanded', false);
          $transcriptBodyContainer.removeClass("inline-transcript-open");
          $buttonText.html(this.model.get("_transcript").inlineTranscriptButton);
      } else {
          $transcriptBodyContainer.stop(true,true).slideDown(function() {
              $(window).resize();
          });
          $button.attr('aria-expanded', true);
          $transcriptBodyContainer.addClass("inline-transcript-open");
          $buttonText.html(this.model.get("_transcript").inlineTranscriptCloseButton);

          if (this.model.get('_transcript')._setCompletionOnView !== false) {
              this.setCompletionStatus();
          }
      }
    }
  });

  Adapt.register("responsiveIframe", ResponsiveIframe);

});
