import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';


export function uiSectionFeatureConfidenceOptions(context) {

    var section = uiSection('feature-confidence-options', context)
        .title(t('background.feature_confidence'))
        .disclosureContent(renderDisclosureContent);

    var _minVal = 0.20;
    var _maxVal = 1;
    var _storedConfidence = prefs('feature_confidence');
    var _sliders = ['feature_confidence'];

    var _options = {
        confidence: (_storedConfidence !== null ? (+_storedConfidence) : 1)
    };

    function clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    }

    function updateValue(d, val) {
        if (!val && d3_event && d3_event.target) {
            val = d3_event.target.value;
        }

        val = clamp(val, _minVal, _maxVal);

        _options[d] = val;
        context.rapidContext().featureConfidence(val);


        if (d === 'feature_confidence') {
            prefs('feature_confidence', val);
        }

        section.reRender();
    }

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.feature-confidence-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'feature-confidence-container controls-list');


        containerEnter
            .append('div')
            .attr('class', 'nudge-instructions')
            .text(t('background.confidence_description'));

        // add slider controls
        var slidersEnter = containerEnter.selectAll('.display-control')
            .data(_sliders)
            .enter()
            .append('div')
            .attr('class', function(d) { return 'display-control display-control-' + d; });

        slidersEnter
            .append('h5')
            .text(function(d) { return t('background.' + d); })
            .append('span')
            .attr('class', function(d) { return 'display-option-value display-option-value-' + d; });

        slidersEnter
            .append('input')
            .attr('class', function(d) { return 'display-option-input display-option-input-' + d; })
            .attr('type', 'range')
            .attr('min', _minVal)
            .attr('max', _maxVal)
            .attr('step', '0.20')
            .on('input', function(d) {
                var val = d3_select(this).property('value');
                updateValue(d, val);
            });

        slidersEnter
            .append('button')
            .attr('title', t('background.reset_confidence'))
            .attr('class', function(d) { return 'display-option-reset display-option-reset-' + d; })
            .on('click', function(d) {
                if (d3_event.button !== 0) return;
                updateValue(d, 1);
            })
            .call(svgIcon('#iD-icon-' + (localizer.textDirection() === 'rtl' ? 'redo' : 'undo')));

        container.selectAll('.display-option-input')
            .property('value', function(d) { return _options[d]; });

        container.selectAll('.display-option-value')
            .text(function(d) { return Math.floor(_options[d] * 100) + '%'; });

        container.selectAll('.display-option-reset')
            .classed('disabled', function(d) { return _options[d] === 1; });

        // first time only, set brightness if needed
        if (containerEnter.size() && _options.brightness !== 1) {
            context.background().brightness(_options.brightness);
        }
    }

    return section;
}
