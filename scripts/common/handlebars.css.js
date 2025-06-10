export const registerCssHandlebarsHelpers=()=>{
    
}

function cssClassSelector(conditionIsTrue, cssClassForCondition, alternateCss){
    if(conditionIsTrue){
        return cssClassForCondition;
    }
    return alternateCss != undefined ? alternateCss: ''
}