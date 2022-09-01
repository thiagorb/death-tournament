import { Program } from './gl';
import { matrixRotate, matrixSetIdentity } from './glm';
import { Object, objectDraw, objectGetComponentTransform } from './model';

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
    return frameItem[FrameItemProperties.Element][ElementProperties.CurrentValue] === frameItem[FrameItemProperties.TargetValue];
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
    for (const frameItem of frame[FrameProperties.Items]) {
        if (frameItem[FrameItemProperties.Element][ElementProperties.AnimatedInStep]) {
            continue;
        }

        animationFrameItemStep(frameItem, deltaTime);
        if (!animationFrameItemComplete(frameItem)) {
            endOfFrame = false;
        }
    }

    if (endOfFrame) {
        frame[FrameProperties.AfterTrigger]?.();

        animation[AnimationProperties.CurrentFrame]++;
        if (animationIsEnd(animation)) {
            animation[AnimationProperties.Running] = false;
            return true;
        }
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

export type AnimationTrigger = () => {};

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

export const animationFrameItemCreate = (element: AnimationElement, targetValue: number, speed: number): AnimationFrameItem => ({
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

const enum BoundElementProperties {
    AnimationElement,
    TransformPath,
}

type BoundElement = {
    [BoundElementProperties.AnimationElement]: AnimationElement;
    [BoundElementProperties.TransformPath]: Array<number>;
};

export const boundElementCreate = (element: AnimationElement, transformPath: Array<number>) => ({
    [BoundElementProperties.AnimationElement]: element,
    [BoundElementProperties.TransformPath]: transformPath,
});

export const enum AnimatableProperties {
    Object,
    AnimationElements,
}
export type Animatable = {
    [AnimatableProperties.Object]: Object;
    [AnimatableProperties.AnimationElements]: Array<BoundElement>;
};

export const animatableBeginStep = (animatable: Animatable) => {
    for (const boundElement of animatable[AnimatableProperties.AnimationElements]) {
        animationElementBeginStep(boundElement[BoundElementProperties.AnimationElement]);
    }
};
export const animatableStep = (animatable: Animatable) => {
    for (const boundElement of animatable[AnimatableProperties.AnimationElements]) {
        const transform = objectGetComponentTransform(
            animatable[AnimatableProperties.Object],
            boundElement[BoundElementProperties.TransformPath]
        );
        matrixSetIdentity(transform);
        matrixRotate(transform, animationElementGetValue(boundElement[BoundElementProperties.AnimationElement]));
    }
};

export const animatableCreate = (object: Object, elements: Animatable[AnimatableProperties.AnimationElements]): Animatable => ({
    [AnimatableProperties.Object]: object,
    [AnimatableProperties.AnimationElements]: elements,
});

export const animatableDraw = (animatable: Animatable, program: Program) => {
    objectDraw(animatable[AnimatableProperties.Object], program);
};
