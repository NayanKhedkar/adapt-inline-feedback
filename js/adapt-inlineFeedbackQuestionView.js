define([
  'coreJS/adapt',
  'coreViews/questionView'
], function (Adapt, QuestionView) {

  var InlineFeedbackComponentView = {

    postRender: function () {
      this.$el.addClass('has-inline-feedback');

      // position feedback after component-widget if applicable
      var $componentFeedback = this.$('.component__feedback');
      if ($componentFeedback.length > 0) {
        this.$('.component__inner').append($componentFeedback);
      }

      QuestionView.prototype.postRender.call(this);

      // if (!this.model.get('_isSubmitted')) return;
      if (this.model.get('_isSubmitted')) {
        // this.getFBElement().addClass('show-feedback');

        // this.populateFeedback();
      }

      if (this.model.get('_isPartOfAssessment')) {
        this.listenTo(Adapt, {
          'assessment:review': this.setAssessmentFeedback,
          'assessments:reset': this.unsetAssessmentFeedback
        });
      }
    },

    setAssessmentFeedback: function (assessmentId) {
      if (!this.model.get('_isPartOfAssessment') || this.model.get('_assessmentId') !== assessmentId) return;
      _.defer(function () {
        this.model.set('_canShowFeedback', true);
        this.model.set('_canShowMarking', true);
        this.model.set('_canShowModelAnswer', true);
        this.model.trigger('question:refresh');
      }.bind(this));

    },

    unsetAssessmentFeedback: function (assessmentState) {
      if (!this.model.get('_isPartOfAssessment') || this.model.get('_assessmentId') !== assessmentState.id) return;
      _.defer(function () {
        this.model.set('_canShowFeedback', false);
        // this.getFBElement().removeClass('show-feedback');
        this.getFBElement().hide();
        this.model.trigger('question:refresh');
      }.bind(this));
    },

    refresh: function () {
      _.defer(function () {
        if (this.model.get("_canShowFeedback")) {
          this.showFeedback();
        }
      }.bind(this));

      QuestionView.prototype.refresh.call(this);
    },

    getFBSelector: function () {
      var isParentBlock = this.$('.component__feedback').length === 0;
      var m = isParentBlock ? this.model.getParent() : this.model;
      return '.' + m.get('_id') + ' .component__feedback';
    },

    getFBElement: function (selector) {
      var $fb = $(this.getFBSelector());
      return selector ? $(selector, $fb) : $fb;
    },

    populateFeedback: function () {
      var $feedbackMessage = this.getFBElement(".component__feedback-content");
        $feedbackMessage.html(this.model.get("feedbackMessage"));
        if (!this.model.get("feedbackImage")) {
          this.getFBElement(".component__feedback-image-container").css("display","none");
          $feedbackMessage.css("width", "auto");
          return;
        }
        this.getFBElement('.component__feedback-image').attr({ 'src': this.model.get('feedbackImage') });
        if (this.model.get('feedbackImageAlt')) {
          this.getFBElement('.component__feedback-image').attr({ 'aria-label': this.model.get('feedbackImageAlt') });
      }
    },

    showFeedback: function () {
      QuestionView.prototype.showFeedback.call(this);
      if (!this.model.get('_canShowFeedback')) return;
      this.getFBElement().addClass('show-feedback');
      this.getFBElement().show();
      this.populateFeedback();

      var anchorSelector = '.' + this.model.get('_id') + ' .feedback-anchor';
      var feedbackSelector = this.getFBSelector();

      // now target a focusable element and focus immediately (a11y_focus defers)...

      // try to focus accessible feedback text if applicable
      if (!this.model.get("_isPartOfAssessment")) {
        if ($(feedbackSelector).length > 0) {
          $(feedbackSelector).a11y_focus();
        } else if ($(anchorSelector).length > 0) { // else try to focus a feedback anchor if present
          $(anchorSelector).a11y_focus();
        } else {// else place focus in a safe place
          $('#a11y-focuser').focus();
        }
      }

      _.delay(function () {
        this.listenToOnce(Adapt, 'page:scrolledTo', this.onScrolledToFeedback);

        var selector = this.$('.feedback-anchor').length > 0 ? anchorSelector : feedbackSelector;
        // Adapt.scrollTo(selector, { duration: 500 });

        if (!this.model.get("_isPartOfAssessment")) {
          // Adapt.scrollTo(selector, { duration: 500 });
        } else {
          this.setCompletionStatus();
        }

      }.bind(this), 250);
    },

    checkQuestionCompletion: function () {
      QuestionView.prototype.checkQuestionCompletion.call(this);
      var isComplete = false;

      if (this.model.get('_isCorrect') || this.model.get('_attemptsLeft') === 0) {
        isComplete = true;
      }

      if (isComplete) {
        // trickle, if used, must be set to listen for _isComplete
        this.model.set('_isInteractionComplete', true);
        this.$('.component__widget').addClass('is-complete show-user-answer');
      }
    },

    onScrolledToFeedback: function () {
      this.setCompletionStatus();

      // we need to kick PLP to update because we've changed the order of setting _isComplete/_isInteractionComplete

      var parentPage = this.model.findAncestor('contentObjects');
      if (parentPage.findDescendantModels('components', { where: { _isAvailable: true, _isOptional: false, _isComplete: false } }).length === 0) {
        // if all page components now complete wait for _isComplete to propagate to page then tell PLP to update
        parentPage.once('change:_isComplete', function () {
          Adapt.trigger('pageLevelProgress:update');
        });
        return;
      }

      // otherwise update PLP as normal
      Adapt.trigger('pageLevelProgress:update');
    }
  };

  return InlineFeedbackComponentView;

});
