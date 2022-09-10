import { Program } from './gl';
import { matrixRotate, matrixSetIdentity, matrixTranslate } from './glm';
import {
    Object,
    objectDraw,
    objectGetComponentTransform,
    objectGetComponentTransformOrder,
    objectGetRootTransform,
    objectTransformComponent,
} from './model';

const enum ElementProperties {
    CurrentValue,
    AnimatedInStep,
}

export type AnimationElement = {
    [ElementProperties.CurrentValue]: number;
    [ElementProperties.AnimatedInStep]: boolean;
};

export const animationElementCreate = (initialValue: number = 0): AnimationElement => ({
    [ElementProperties.CurrentValue]: initialValue,
    [ElementProperties.AnimatedInStep]: false,
});

const animationFrameItemStep = (frameItem: AnimationFrameItem, deltaTime: number) => {
    const element = frameItem[FrameItemProperties.Element];
    element[ElementProperties.AnimatedInStep] = true;
    const relativeSpeed = frameItem[FrameItemProperties.Speed] * deltaTime;
    const delta = frameItem[FrameItemProperties.TargetValue] - element[ElementProperties.CurrentValue];
    if (Math.abs(delta) <= relativeSpeed) {
        element[ElementProperties.CurrentValue] = frameItem[FrameItemProperties.TargetValue];
    } else {
        element[ElementProperties.CurrentValue] += relativeSpeed * Math.sign(delta);
    }
};

const animationFrameItemComplete = (frameItem: AnimationFrameItem) => {
    return (
        frameItem[FrameItemProperties.Element][ElementProperties.CurrentValue] ===
        frameItem[FrameItemProperties.TargetValue]
    );
};

export const animationElementBeginStep = (element: AnimationElement) => {
    element[ElementProperties.AnimatedInStep] = false;
};

export const animationStep = (animation: Animation, deltaTime: number): boolean => {
    if (!animation[AnimationProperties.Running]) {
        return false;
    }

    let endOfFrame = true;
    const frame = animation[AnimationProperties.Frames][animation[AnimationProperties.CurrentFrame]];
    const frameItems = frame[FrameProperties.Items];
    let i = frameItems.length;
    while (i--) {
        const frameItem = frameItems[i];
        if (frameItem[FrameItemProperties.Element][ElementProperties.AnimatedInStep]) {
            continue;
        }

        animationFrameItemStep(frameItem, deltaTime);
        if (!animationFrameItemComplete(frameItem)) {
            endOfFrame = false;
        }
    }

    if (endOfFrame) {
        animation[AnimationProperties.CurrentFrame]++;
        const isEnd = animationIsEnd(animation);
        if (isEnd) {
            animation[AnimationProperties.Running] = false;
        }

        frame[FrameProperties.AfterTrigger]?.();
        return isEnd;
    }

    return false;
};

export const animationIsRunning = (animation: Animation): boolean => animation[AnimationProperties.Running];
const animationIsEnd = (animation: Animation) =>
    animation[AnimationProperties.CurrentFrame] === animation[AnimationProperties.Frames].length;

export const animationElementGetValue = (element: AnimationElement): number => element[ElementProperties.CurrentValue];

const enum AnimationProperties {
    Frames,
    Running,
    CurrentFrame,
}

const enum FrameItemProperties {
    Element,
    TargetValue,
    Speed,
}

export type AnimationFrameItem = {
    [FrameItemProperties.Element]: AnimationElement;
    [FrameItemProperties.TargetValue]: number;
    [FrameItemProperties.Speed]: number;
};

const enum FrameProperties {
    Items,
    AfterTrigger,
}

type AnimationFrame = {
    [FrameProperties.Items]: Array<AnimationFrameItem>;
    [FrameProperties.AfterTrigger]: AnimationTrigger;
};

export type Animation = {
    [AnimationProperties.Frames]: Array<AnimationFrame>;
    [AnimationProperties.Running]: boolean;
    [AnimationProperties.CurrentFrame]: number;
};

export type AnimationTrigger = () => void;

export const animationCreate = (frames: Animation[AnimationProperties.Frames]): Animation => ({
    [AnimationProperties.Frames]: frames,
    [AnimationProperties.Running]: false,
    [AnimationProperties.CurrentFrame]: 0,
});

export const animationStart = (animation: Animation): void => {
    animation[AnimationProperties.CurrentFrame] = 0;
    animation[AnimationProperties.Running] = true;
};

export const animationPause = (animation: Animation): void => {
    animation[AnimationProperties.Running] = false;
};

export const animationResume = (animation: Animation): void => {
    animation[AnimationProperties.Running] = true;
    if (animationIsEnd(animation)) {
        animation[AnimationProperties.CurrentFrame] = 0;
    }
};

export const animationFrameItemCreate = (
    element: AnimationElement,
    targetValue: number,
    speed: number
): AnimationFrameItem => ({
    [FrameItemProperties.Element]: element,
    [FrameItemProperties.TargetValue]: targetValue,
    [FrameItemProperties.Speed]: speed,
});

export const animationFrameCreate = (
    items: AnimationFrame[FrameProperties.Items],
    afterTrigger: AnimationTrigger = null
): AnimationFrame => ({
    [FrameProperties.Items]: items,
    [FrameProperties.AfterTrigger]: afterTrigger,
});

export const enum AnimatedProperty {
    Rotation,
    TranslationY,
}

const enum BoundElementProperties {
    AnimationElement,
    AnimatedProperty,
    ComponentId,
}

type BoundElement = {
    [BoundElementProperties.AnimationElement]: AnimationElement;
    [BoundElementProperties.AnimatedProperty]: AnimatedProperty;
    [BoundElementProperties.ComponentId]: number;
};

export const boundElementCreate = (
    element: AnimationElement,
    componentId: number,
    property: AnimatedProperty = AnimatedProperty.Rotation
): BoundElement => ({
    [BoundElementProperties.AnimationElement]: element,
    [BoundElementProperties.AnimatedProperty]: property,
    [BoundElementProperties.ComponentId]: componentId,
});

export const enum AnimatableProperties {
    Object,
    AnimationElements,
    BoundElementsByObjectComponent,
}
export type Animatable = {
    [AnimatableProperties.Object]: Object;
    [AnimatableProperties.AnimationElements]: Array<BoundElement>;
    [AnimatableProperties.BoundElementsByObjectComponent]: Array<Array<BoundElement>>;
};

export const animatableBeginStep = (animatable: Animatable) => {
    const elements = animatable[AnimatableProperties.AnimationElements];
    let i = elements.length;
    while (i--) {
        const boundElement = elements[i];
        animationElementBeginStep(boundElement[BoundElementProperties.AnimationElement]);
        const transform = objectGetComponentTransform(
            animatable[AnimatableProperties.Object],
            boundElement[BoundElementProperties.ComponentId]
        );
        matrixSetIdentity(transform);
    }
};

export const animatableCreate = (
    object: Object,
    elements: Animatable[AnimatableProperties.AnimationElements]
): Animatable => {
    const boundElementsByObjectComponent = objectGetComponentTransformOrder(object).map(c => []);
    for (const element of elements) {
        boundElementsByObjectComponent[element[BoundElementProperties.ComponentId]].push(element);
    }

    return {
        [AnimatableProperties.Object]: object,
        [AnimatableProperties.AnimationElements]: elements,
        [AnimatableProperties.BoundElementsByObjectComponent]: boundElementsByObjectComponent,
    };
};

export const animatableTransform = (animatable: Animatable) => {
    const object = animatable[AnimatableProperties.Object];
    for (const componentId of objectGetComponentTransformOrder(object)) {
        objectTransformComponent(object, componentId);
        const transform = objectGetComponentTransform(animatable[AnimatableProperties.Object], componentId);
        for (const boundElement of animatable[AnimatableProperties.BoundElementsByObjectComponent][componentId]) {
            if (boundElement[BoundElementProperties.AnimatedProperty] === AnimatedProperty.Rotation) {
                matrixRotate(
                    transform,
                    animationElementGetValue(boundElement[BoundElementProperties.AnimationElement])
                );
            } else if (boundElement[BoundElementProperties.AnimatedProperty] === AnimatedProperty.TranslationY) {
                matrixTranslate(
                    transform,
                    0,
                    animationElementGetValue(boundElement[BoundElementProperties.AnimationElement])
                );
            }
        }
    }
};

export const animatableDraw = (animatable: Animatable, program: Program) => {
    objectDraw(animatable[AnimatableProperties.Object], program);
};

export const animatableGetRootTransform = (animatable: Animatable) =>
    objectGetRootTransform(animatable[AnimatableProperties.Object]);
