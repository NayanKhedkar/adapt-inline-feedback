define([
    'core/js/adapt'
], function (Adapt) {

    var AssessmentReviewView = Backbone.View.extend({

        events: {
            'click .review-assessment': 'onReviewAssessment'
        },

        initialize: function () {
            this.render();
            this.checkReviewEnabled();
            this.setupEventListners();
        },

        render: function () {
            var template = Handlebars.templates.assessmentReview;
            var data = this.model.get('_assessmentReview');
            $('.' + this.model.get('_id')).find('.article__inner').append(this.$el.html(template(data)));
        },

        setupEventListners: function () {
            this.listenTo(Adapt, {
                'assessments:complete': this.onAssessmentComplete,
                'assessments:reset': this.onAssessmentReset
            });
        },

        checkReviewEnabled: function () {
            let assessmentComplete = this.model.get('_isAssessmentComplete');
            this.toggleAssessmentReview(assessmentComplete);
        },

        onAssessmentComplete: function (assessmentState) {
            if (assessmentState.id == (this.model.get('_assessment')?._id)) {
                this.toggleAssessmentReview(true);
            }
        },

        onAssessmentReset: function (assessmentState) {
            let extractComponentModel = _.filter(this.model.getAllDescendantModels(), function (model) {
                   return model.get("_type") === 'component'
            });
            extractComponentModel.forEach(model => {
                model.set('_canShowFeedback', false);
            });

            if (assessmentState.id == (this.model.get('_assessment')?._id)) {
                this.toggleAssessmentReview(false);
            }
        },

        toggleAssessmentReview: function (isOn) {
            if (isOn) {
                this.$(".review-assessment").show();
            } else {
                this.$(".review-assessment").hide();
            }
        },

        onReviewAssessment: function () {
            if (!this.model.get('_isAssessmentComplete')) return;
            $('.article.' + this.model.get('_id')).velocity('scroll', { duration: 500, easing: 'easeInBack' });
            Adapt.trigger('assessment:review', this.model.get('_assessment')._id);   
        }
    });

    Adapt.on("articleView:postRender", function (articleView) {
        if (!(articleView.model.get('_assessmentReview') && articleView.model.get('_assessmentReview')._isEnabled)) {
            return
        }
        new AssessmentReviewView({ model: articleView.model });
    });
});
