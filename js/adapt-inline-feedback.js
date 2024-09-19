define([
  'core/js/adapt',
  'core/js/views/questionView',
  './adapt-inlineFeedbackQuestionView',
  './assessmentReviewView'
], function (Adapt, QuestionView, InlineFeedbackQuestionView) {

  var QuestionViewInitialize = QuestionView.prototype.initialize;

  QuestionView.prototype.initialize = function (options) {
    var assessmentQuestionFbOnPass = this.model.get('_isPartOfAssessment') && Adapt.course.get("_assessmentQuestionsFeedbackOnSubmit")
      && Adapt.course.get("_assessmentQuestionsFeedbackOnSubmit")._isEnabled;

    if (assessmentQuestionFbOnPass) {
      _.extend(this, InlineFeedbackQuestionView);
    }

    return QuestionViewInitialize.apply(this, arguments);
  };

});
