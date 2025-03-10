import mitt, { Emitter } from 'mitt'
import * as React from 'react'
import {
  findNodeHandle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import { TourGuideContext, Ctx } from './TourGuideContext'
import { useIsMounted } from '../hooks/useIsMounted'
import { IStep, Labels, StepObject, Steps } from '../types'
import * as utils from '../utilities'
import { Modal } from './Modal'
import { OFFSET_WIDTH } from './style'
import { TooltipProps } from './Tooltip'

const { useMemo, useEffect, useState, useRef } = React
/*
This is the maximum wait time for the steps to be registered before starting the tutorial
At 60fps means 2 seconds
*/
const MAX_START_TRIES = 120

export interface TourGuideProviderProps {
  tooltipComponent?: React.ComponentType<TooltipProps>
  tooltipStyle?: StyleProp<ViewStyle>
  labels?: Labels
  androidStatusBarVisible?: boolean
  startAtMount?: string | boolean
  backdropColor?: string
  verticalOffset?: number
  wrapperStyle?: StyleProp<ViewStyle>
  maskOffset?: number
  borderRadius?: number
  animationDuration?: number
  children: React.ReactNode
  dismissOnPress?: boolean
  preventOutsideInteraction?: boolean
  scrollViewTopReserved?: number
}

export const TourGuideProvider = ({
  children,
  wrapperStyle,
  labels,
  tooltipComponent,
  tooltipStyle,
  androidStatusBarVisible,
  backdropColor,
  animationDuration,
  maskOffset,
  borderRadius,
  verticalOffset,
  startAtMount = false,
  dismissOnPress = false,
  preventOutsideInteraction = false,
  ...props
}: TourGuideProviderProps) => {
  const [scrollRef, setScrollRef] = useState<React.RefObject<any>>()
  const [scrollViewTopReserved, setScrollViewTopReserved] = useState<
    number | undefined
  >(props.scrollViewTopReserved)
  const [tourKey, setTourKey] = useState<string | '_default'>('_default')
  const [visible, updateVisible] = useState<Ctx<boolean | undefined>>({
    _default: false,
  })
  const setVisible = (key: string, value: boolean) =>
    updateVisible((visible) => {
      const newVisible = { ...visible }
      newVisible[key] = value
      return newVisible
    })
  const [currentStep, updateCurrentStep] = useState<Ctx<IStep | undefined>>({
    _default: undefined,
  })
  const [steps, setSteps] = useState<Ctx<Steps>>({ _default: [] })

  const [canStart, setCanStart] = useState<Ctx<boolean>>({ _default: false })

  const startTries = useRef<number>(0)
  const { current: mounted } = useIsMounted()

  const { current: eventEmitter } = useRef<Ctx<Emitter>>({
    _default: new mitt(),
  })

  const modal = useRef<any>()

  useEffect(() => {
    if (mounted && visible[tourKey] === false) {
      eventEmitter[tourKey]?.emit('stop')
    }
  }, [visible])

  useEffect(() => {
    setTimeout(() => {
      if (visible[tourKey] || currentStep[tourKey]) {
        moveToCurrentStep(tourKey)
      }
    }, 150)
  }, [visible, currentStep])

  useEffect(() => {
    if (mounted) {
      if (steps[tourKey]) {
        if (
          (Array.isArray(steps[tourKey]) && steps[tourKey].length > 0) ||
          Object.entries(steps[tourKey]).length > 0
        ) {
          setCanStart((obj) => {
            const newObj = { ...obj }
            newObj[tourKey] = true
            return newObj
          })
          if (typeof startAtMount === 'string') {
            start(startAtMount)
          } else if (startAtMount) {
            start('_default')
          }
        } else {
          setCanStart((obj) => {
            const newObj = { ...obj }
            newObj[tourKey] = false
            return newObj
          })
        }
      }
    }
  }, [mounted, steps])

  const moveToCurrentStep = async (key: string) => {
    const size = await currentStep[key]?.target.measure()
    if (
      size === undefined ||
      isNaN(size.width) ||
      isNaN(size.height) ||
      isNaN(size.x) ||
      isNaN(size.y)
    ) {
      return
    }
    await modal.current?.animateMove({
      width: size.width + OFFSET_WIDTH,
      height: size.height + OFFSET_WIDTH,
      left: Math.round(size.x) - OFFSET_WIDTH / 2,
      top: Math.round(size.y) - OFFSET_WIDTH / 2 + (verticalOffset || 0),
    })
  }

  const setCurrentStep = async (
    key: string,
    step?: IStep,
    localScrollRef?: React.RefObject<any>,
  ) => {
    const actualScrollRef = scrollRef?.current ?? localScrollRef?.current
    return await new Promise<void>(async (resolve) => {
      if (actualScrollRef && step) {
        await step.wrapper.measureLayout(
          findNodeHandle(actualScrollRef),
          (_x: number, y: number, _w: number, h: number) => {
            let yOffsett = y > 0 ? y - h : 0
            if (scrollViewTopReserved) {
              if (yOffsett > scrollViewTopReserved) {
                yOffsett -= scrollViewTopReserved
              } else {
                yOffsett = 0
              }
            }
            if (actualScrollRef) {
              if (typeof actualScrollRef.scrollTo === 'function') {
                actualScrollRef.scrollTo({ y: yOffsett, animated: true })
              } else if (typeof actualScrollRef.scrollToOffset === 'function') {
                actualScrollRef.scrollToOffset({
                  offset: yOffsett,
                  animated: true,
                })
              }
            }
          },
        )
        setTimeout(() => {
          updateCurrentStep((currentStep) => {
            const newStep = { ...currentStep }
            newStep[key] = step
            eventEmitter[key]?.emit('stepChange', step)
            return newStep
          })
          resolve()
        }, 100)
      } else {
        updateCurrentStep((currentStep) => {
          const newStep = { ...currentStep }
          newStep[key] = step
          eventEmitter[key]?.emit('stepChange', step)
          return newStep
        })
        resolve()
      }
    })
  }

  const getNextStep = (
    key: string,
    step: IStep | undefined = currentStep[key],
  ) => utils.getNextStep(steps[key]!, step)

  const getPrevStep = (
    key: string,
    step: IStep | undefined = currentStep[key],
  ) => utils.getPrevStep(steps[key]!, step)

  const getFirstStep = (key: string) => utils.getFirstStep(steps[key]!)

  const getLastStep = (key: string) => utils.getLastStep(steps[key]!)

  const isFirstStep = useMemo(() => {
    const obj: Ctx<boolean> = {} as Ctx<boolean>
    Object.keys(currentStep).forEach((key) => {
      obj[key] = currentStep[key] === getFirstStep(key)
    })
    return obj
  }, [currentStep])

  const isLastStep = useMemo(() => {
    const obj: Ctx<boolean> = {} as Ctx<boolean>
    Object.keys(currentStep).forEach((key) => {
      obj[key] = currentStep[key] === getLastStep(key)
    })
    return obj
  }, [currentStep])

  const _next = (key: string) => {
    const nextStep = getNextStep(key)!
    const current = currentStep[key]
    if (current?.onNext) {
      const result = current.onNext(current, nextStep)
      if (result === 'stop') {
        return _stop(key)
      } else if (result === 'doNothing') {
        return
      }
    }
    return setCurrentStep(key, nextStep)
  }

  const _prev = (key: string) => {
    const prevStep = getPrevStep(key)!
    const current = currentStep[key]
    if (current?.onPrevious) {
      const result = current.onPrevious(current, prevStep)
      if (result === 'stop') {
        return _stop(key)
      } else if (result === 'doNothing') {
        return
      }
    }
    return setCurrentStep(key, prevStep)
  }
  const _stop = (key: string) => {
    setVisible(key, false)
    setCurrentStep(key, undefined)
  }

  const registerStep = (key: string, step: IStep) => {
    setCanStart((obj) => {
      if (!obj[key]) {
        return obj
      }
      const newObj = { ...obj }
      newObj[key] = false
      return newObj
    })
    setSteps((previousSteps) => {
      const newSteps = { ...previousSteps }
      newSteps[key] = {
        ...previousSteps[key],
        [step.name]: step,
      }
      return newSteps
    })
    if (!eventEmitter[key]) {
      eventEmitter[key] = new mitt()
    }
  }

  const unregisterStep = (key: string, stepName: string) => {
    if (!mounted) {
      return
    }
    setSteps((previousSteps) => {
      const newSteps = { ...previousSteps }
      newSteps[key] = Object.entries(previousSteps[key] as StepObject)
        .filter(([key]) => key !== stepName)
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {})
      return newSteps
    })
  }

  const getCurrentStep = (key: string) => currentStep[key]

  const start = async (
    key: string,
    fromStep?: number,
    _scrollRef?: React.RefObject<any>,
  ) => {
    if (!steps[key] || (fromStep && !(steps[key] as StepObject)[fromStep])) {
      return
    }

    if (!scrollRef) {
      setScrollRef(_scrollRef)
    }
    const currentStep = fromStep
      ? (steps[key] as StepObject)[fromStep]
      : getFirstStep(key)

    if (startTries.current > MAX_START_TRIES) {
      startTries.current = 0
      return
    }
    if (!currentStep) {
      startTries.current += 1
      requestAnimationFrame(() => start(key, fromStep))
    } else {
      eventEmitter[key]?.emit('start')
      await setCurrentStep(key, currentStep, _scrollRef)
      setVisible(key, true)
      startTries.current = 0
    }
  }
  const next = () => _next(tourKey)
  const prev = () => _prev(tourKey)
  const stop = () => _stop(tourKey)

  const setScrollView = (_ref: React.RefObject<any>, _topReserved: number) => {
    setScrollRef(_ref)
    setScrollViewTopReserved(_topReserved)
  }

  return (
    <View style={[styles.container, wrapperStyle]}>
      <TourGuideContext.Provider
        value={{
          eventEmitter,
          registerStep,
          unregisterStep,
          getCurrentStep,
          start,
          stop,
          canStart,
          setTourKey,
          setScrollView,
        }}
      >
        {children}
        <Modal
          ref={modal}
          {...{
            next,
            prev,
            stop,
            visible: visible[tourKey],
            isFirstStep: isFirstStep[tourKey],
            isLastStep: isLastStep[tourKey],
            currentStep: currentStep[tourKey],
            labels,
            tooltipComponent,
            tooltipStyle,
            androidStatusBarVisible,
            backdropColor,
            animationDuration,
            maskOffset,
            borderRadius,
            dismissOnPress,
            preventOutsideInteraction,
          }}
        />
      </TourGuideContext.Provider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
