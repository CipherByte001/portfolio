// Static project data — edit this file directly to add/update/remove projects.
// No database, no build step beyond the normal `npm run dev` / deploy — just edit and save.
// `media.thumb` / `media.src` paths are relative to the site root; drop new images into /public.

export const projects = [
  {
    id: "mnist-digit-classification",
    title: "MNIST Digit Classification with Neural Network | Machine Learning Project",
    excerpt: "Classify handwritten digits from the MNIST dataset using a neural network built with TensorFlow/Keras.",
    desc: `In this project, we use a neural network to classify handwritten digits from the MNIST dataset with Python and TensorFlow/Keras. The model architecture involves a fully connected neural network that is trained to recognize digits from 0 to 9.

The tutorial covers data preprocessing, model creation, training, and evaluation. We also discuss techniques to improve model performance and the importance of validation accuracy during training.

- Framework: TensorFlow/Keras
- Dataset: MNIST
- Model: Fully connected neural network
- Activation Function: ReLU
- Optimizer: Adam

This project is a great starting point for those interested in learning how to implement deep learning models and understand the basics of neural networks and image classification.`,
    tags: ["Machine Learning", "Neural Networks", "MNIST", "TensorFlow", "Keras", "Image Classification", "Deep Learning"],
    components: ["Python", "TensorFlow", "Keras", "MNIST Dataset"],
    media: { type: "youtube", id: "DVQL8maZAx4", thumb: "MNIST.png" },
  },
  {
    id: "stm32-dsp-temperature",
    title: "STM32 Digital Signal Processing | Noise vs Smoothed Temperature (With/Without DSP)",
    excerpt: "Measure temperature with a 10k NTC and see the difference between raw ADC values and DSP-smoothed data on an OLED graph.",
    desc: `This project uses the STM32F103C8 Blue Pill, a 10k NTC thermistor, and a SSD1306 OLED to build a live temperature monitor. The display shows the current temperature, a scrolling graph of recent history, min/max values, and the raw ADC reading.

A key feature is comparing readings with and without Digital Signal Processing (DSP). Without DSP, the graph and temperature values jitter due to ADC noise. With DSP enabled (a Simple Moving Average filter), readings become smooth and stable, with only a small delay in response.

- Board: STM32F103C8 (Blue Pill)
- Display: 0.96" OLED SSD1306 (I2C)
- Sensor: 10k NTC thermistor + 10k resistor divider
- ADC: PA1 (ADC1_IN1)
- DSP: Simple Moving Average filter (toggle on/off)

This is a great introduction to ADC on STM32 and to digital signal processing techniques for sensor data. You'll clearly see how DSP improves stability of embedded measurements.`,
    tags: ["STM32", "Digital Signal Processing", "ADC", "Thermistor", "OLED", "DSP", "Moving Average", "Embedded"],
    components: ["STM32F103C8 (Blue Pill)", "SSD1306 OLED", "NTC 10k Thermistor", "Resistor 10k"],
    media: { type: "youtube", id: "8zwHq98azvQ", thumb: "STM32f103.jpeg" },
  },
  {
    id: "stm32-oled-counter",
    title: "Digital Counter on OLED Display using STM32",
    excerpt: "Counts 1–10,000 on 0.96\" OLED (STM32F103C8).",
    desc: `This project demonstrates a simple yet effective digital counter system using the STM32F103C8 Blue Pill microcontroller and a 0.96-inch OLED display. The system continuously counts from 1 to 10,000, displaying each number on the OLED screen with proper alignment for 1, 2, 3, and 4-digit values.

The project features dynamic screen updates and smooth transitions, with a delay between number updates to make the display easily readable. The main goal is to showcase the ability of STM32 microcontrollers to interface with an OLED display and handle basic operations such as converting integers to strings and updating the display at regular intervals.

This project can be expanded further by adding functionalities like button-based pause/resume, speed control, or even a countdown mode.`,
    tags: ["STM32", "Embedded", "OLED", "Blue Pill"],
    components: ["STM32F103C8", "OLED 0.96\""],
    media: { type: "youtube", id: "0hqF-edwhlI", thumb: "hq720.jpg" },
  },
  {
    id: "email-spam-classification",
    title: "Email Spam Classification Using Machine Learning",
    excerpt: "Built an ML-based email spam filter using Logistic Regression and NLP (TF-IDF). Achieved strong accuracy and deployed a real-time web demo.",
    desc: `Overview
This project demonstrates a machine learning-based spam email classifier. It leverages Natural Language Processing (NLP) and TF-IDF features to transform raw email text into structured numerical data that Logistic Regression can learn from, ensuring accurate spam vs ham predictions.

Workflow
- Cleaning, tokenization, stop-word removal
- TF-IDF feature extraction
- Evaluation with accuracy, precision, recall, F1

Deployment & Demo
- Web demo with instant spam / ham prediction

Applications
- Email clients (Gmail / Outlook)
- Enterprise anti-phishing & security

Key Takeaways
- Hands-on NLP in Python
- End-to-end model deployment`,
    tags: ["Machine Learning", "Spam Classification", "Logistic Regression", "Python"],
    components: ["Anaconda", "VS Code"],
    media: { type: "youtube", id: "Le5HsRq_mWM", thumb: "images.jpeg" },
  },
  {
    id: "stm32-hc05-bluetooth",
    title: "STM32 Blue Pill + HC-05 Bluetooth",
    excerpt: "Control External LED (PB0) from Phone",
    desc: `In this project I demonstrate how to use the STM32F103C8 "Blue Pill" board together with the HC-05 Bluetooth module to control an external LED connected to PB0 directly from a mobile phone.

The firmware was developed using STM32CubeMX and STM32CubeIDE, with STM32CubeProgrammer for flashing. Communication is handled through USART2 (PA2/PA3) using interrupt-based UART. The HC-05 receives commands such as:

- "led on" -> LED turns ON
- "led off" -> LED turns OFF
- "who" -> board info response

This beginner-friendly example is a first step into Bluetooth control with STM32. You can easily extend it to multiple LEDs, relays, or even motors to build IoT and robotics applications.`,
    tags: ["STM32", "Embedded", "Bluetooth", "HC-05", "Blue Pill", "IoT", "LED"],
    components: ["STM32F103C8 (Blue Pill)", "HC-05 Bluetooth Module", "External LED (PB0)"],
    media: { type: "youtube", id: "pf2VVXozRHk", thumb: "bluetooth.jpg" },
  },
  {
    id: "stm32-timer-led-blink",
    title: "STM32 Blue Pill | LED Blink with Timer (No Delay)",
    excerpt: "Blink onboard LED (PC13) using a hardware timer interrupt—no HAL_Delay.",
    desc: `This project blinks the onboard LED (PC13) on the STM32F103C8 "Blue Pill" using a hardware timer interrupt instead of blocking delays. The CPU stays free for other tasks while the timer toggles the LED at a fixed rate.

Configured in STM32CubeMX: enable TIMx (e.g., TIM2) in Output Compare or Update interrupt mode, set the prescaler/period for your blink rate, and enable the timer IRQ in NVIC. In the ISR, call HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13).

- Board: STM32F103C8 (Blue Pill)
- LED: Onboard PC13 (active-low)
- Timer: TIM2 @ 1 Hz blink (example)

Result: smooth, non-blocking LED blink you can extend for multitasking, PWM, or scheduled tasks without using HAL_Delay.`,
    tags: ["STM32", "Timers", "Blue Pill", "Interrupts", "Bare-metal", "Embedded"],
    components: ["STM32F103C8 (Blue Pill)"],
    media: { type: "youtube", id: "3Kux8YE9Rj8", thumb: "pwm-output-mode.jpg" },
  },
  {
    id: "stm32-push-button-led",
    title: "STM32 Blue Pill | Push Button LED Control",
    excerpt: "Toggle onboard LED (PC13) using a push button on PB1.",
    desc: `In this project I show how to use a push button input on the STM32F103C8 Blue Pill to control the onboard LED (PC13). When the button is pressed, the LED toggles ON or OFF.

Configured in STM32CubeMX:
- PB1 as GPIO_Input (with Pull-up enabled)
- PC13 as GPIO_Output (onboard LED, active-low)

The firmware continuously polls the button state in the while(1) loop and toggles the LED accordingly. You can extend this by using interrupts to detect button presses for more efficient designs.

This is one of the simplest STM32 projects to get started with digital input/output.`,
    tags: ["STM32", "Blue Pill", "GPIO", "Push Button", "LED", "Embedded"],
    components: ["STM32F103C8 (Blue Pill)", "Push Button", "LED (PC13)"],
    media: { type: "youtube", id: "JpXk9mgQoKU", thumb: "button.jpg" },
  },
];
