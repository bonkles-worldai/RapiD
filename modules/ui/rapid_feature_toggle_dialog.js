import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { icon } from './intro/helper';
import { uiModal } from './modal';
import marked from 'marked';


export function uiRapidFeatureToggleDialog(context, AIFeatureToggleKey, featureToggleKeyDispatcher) {


    function toggleSvgBuildings () {
        var drawAiFeatures = context.layers().layer('ai-features');
        drawAiFeatures.toggleBuildings();
    }


    function toggleSvgRoads() {
        var drawAiFeatures = context.layers().layer('ai-features');
        drawAiFeatures.toggleRoads();
    }


    function handleToggleAllClick(){
        var drawAiFeatures = context.layers().layer('ai-features');
        drawAiFeatures.enabled(!drawAiFeatures.enabled());
        redrawOnToggle();
    }


    function keyPressFormHandler(){
        if (d3_event.shiftKey &&
            d3_event.key === t('map_data.layers.ai-features.key')){
            handleToggleAllClick();
        }
    }


    function redrawOnToggle() {
        var drawAiFeatures = context.layers().layer('ai-features');
        // We need check/uncheck the 'all options' boxes, and
        // disable the other checkboxes so that the user
        // cannot interact with them.
        var roadCheckbox = d3_select('#rapid-road-toggle');
        var buildingCheckbox = d3_select('#rapid-building-toggle');
        var allCheckbox = d3_select('#rapid-all-toggle');

        // We also need to add a class to the whole option so that we
        // can style it accordingly.
        var roadOption = d3_select('#section-rapid-road-toggle');
        var buildingOption = d3_select('#section-rapid-building-toggle');

        if (drawAiFeatures.showAll()) {
            allCheckbox.property('checked', true);
            roadCheckbox.attr('disabled', null);
            buildingCheckbox.attr('disabled', null);
            roadOption.classed('disabled', false);
            buildingOption.classed('disabled', false);

        } else {
            allCheckbox.property('checked', false);
            roadCheckbox.attr('disabled', true);
            buildingCheckbox.attr('disabled', true);
            roadOption.classed('disabled', true);
            buildingOption.classed('disabled', true);
        }
    }


    return function(selection) {
        var modalSelection = uiModal(selection);

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal modal-rapid');

        var modal = modalSelection.select('.content')
            .append('form')
            .attr('class', 'fillL rapid-feature rapid-stack')
            .on('keypress', keyPressFormHandler);


        var drawAiFeatures = context.layers().layer('ai-features');

        addCheckBox({
            modal: modal,
            id: 'rapid-all-toggle',
            label: t('rapid_feature_toggle.toggle_all', {
                rapidicon: icon('#iD-logo-rapid', 'logo-rapid'),
            }),
            description: null,
            handler: handleToggleAllClick,
            enabled: drawAiFeatures.showAll(),
            greyout: false
        });

        modal
            .append('div')
            .attr('class','modal-section rapid-checkbox section-divider');

        addCheckBox({
            modal: modal,
            id: 'rapid-road-toggle',
            label: t('rapid_feature_toggle.roads'),
            license: marked(t('rapid_feature_toggle.roads_license')),
            description: t('rapid_feature_toggle.roads_provided_by'),
            handler: toggleSvgRoads,
            enabled: drawAiFeatures.showRoads(),
            greyout: !drawAiFeatures.showAll(),
        });

        addCheckBox({
            modal: modal,
            id: 'rapid-building-toggle',
            label: t('rapid_feature_toggle.buildings'),
            description: t('rapid_feature_toggle.provided_by'),
            providers: ['Facebook', 'Microsoft'],
            license: marked(t('rapid_feature_toggle.buildings_license')),
            handler: toggleSvgBuildings,
            enabled: drawAiFeatures.showBuildings(),
            greyout: !drawAiFeatures.showAll(),
        });

        featureToggleKeyDispatcher.on('ai_feature_toggle', function () {
            redrawOnToggle();
        });
    };

    function onProviderChange(id) {
        var drawAiFeatures = context.layers().layer('ai-features');
        var providerName = d3_select(`select.${id}`).property('value');
        drawAiFeatures.toggleBuildings(providerName);
    }

    function addCheckBox(options) {
        var toggleOption = options.modal
            .append('div')
            .attr('class','modal-section rapid-checkbox')
            .classed('disabled', options.greyout)
            .attr('id', 'section-' + options.id);

        var toggleOptionText =  toggleOption.append('div')
            .attr('class', 'rapid-feature-label-container');

        toggleOptionText.append('div')
            .attr('class', 'rapid-feature-label')
            .html(options.label);

        if (options.description) {
            toggleOptionText
                .append('div')
                .attr('class', 'rapid-feature-label-divider');

            var optionText= toggleOptionText
                .append('div')
                .attr('class', 'rapid-feature-description')
                .text(options.description);


            if (options.providers) {
                var providerSelect  = optionText.append('select')
                    .attr('class', 'provider ' + options.id)
                    .on('change', () => onProviderChange(options.id));

                providerSelect.selectAll('option')
                    .data(options.providers).enter()
                    .append('option').text(function (d) { return d; });
            }
        } else {
            toggleOptionText
                .append('span')
                .attr('class', 'rapid-feature-hotkey')
                .html('(' + AIFeatureToggleKey + ')');
        }

        if (options.license) {
            toggleOptionText
                .append('div')
                .attr('class', 'rapid-feature-label-divider');

            toggleOptionText
                .append('div')
                .attr('class', 'rapid-feature-license')
                .html(options.license);

            toggleOptionText.select('p a')
                .attr('target','_blank');
        }

        var customCheckbox = toggleOption
            .append('label')
            .attr('class', 'rapid-checkbox-label');

        customCheckbox
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', options.id)
            .attr('class', 'rapid-feature-checkbox')
            .property('checked', options.enabled)
            .attr('disabled', options.greyout ? true : null)
            .on('click', options.handler);

        customCheckbox
            .append('div')
            .attr('class', 'rapid-checkbox-custom');
    }
}
