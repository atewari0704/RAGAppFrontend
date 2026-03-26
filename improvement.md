# RAG Frontend UI/UX Improvement Tasks

## 1. Layout & Structure
* **Constrain Width:** Wrap the main content container with a maximum width (e.g., `max-w-3xl` or `max-w-4xl` in Tailwind) and center it horizontally (`mx-auto`) to prevent the input fields and dropzone from stretching too wide on large desktop screens.

## 2. Typography & Header
* **Header Styling:** Update the "RAG Frontend" `<h1>` tag to be more stylized. Add a relevant SVG icon (e.g., a database icon or a document with a magic wand/sparkles) next to the text.
* **Visual Hierarchy:** Reduce the font weight and soften the text color (e.g., `text-gray-600` or `text-gray-700`) for the input sub-labels ("Question", "How many chunks to retrieve") to contrast properly with the bolder card headings.

## 3. Cards & Depth
* **Card Styling:** Add a soft drop shadow to the main white container cards (e.g., `shadow-md` or `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`).
* **Border Radius:** Increase the border radius on the cards slightly (e.g., `rounded-xl` or `border-radius: 0.75rem`) for a softer, more modern appearance.

## 4. Color Palette
* **Primary Brand Color:** Standardize on a specific primary color (e.g., a vibrant indigo, teal, or deep blue) for the "Ask" button, the dropzone dashed border, and the cloud upload icon.
* **Gradients (Optional):** Apply a subtle linear gradient background to the primary action buttons for a modern AI-tool aesthetic.

## 5. Input Components & Dropzone
* **Dropzone Interactivity:** Implement a hover and drag-over state for the dashed upload area. When active, change the background to a very light shade of the primary color (e.g., `hover:bg-blue-50`).
* **File Selected State:** Update the "No selected File" container state. When a file is successfully queued, display the uploaded filename, the file size, a colored PDF icon, and an interactive "X" button to clear the selection.
* **Text Inputs:** Add an active focus state to the text inputs. On focus, transition the border color to the primary brand color and add a soft focus ring (e.g., `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`).

## 6. Button States & Micro-interactions
* **Disabled States:** Ensure the "Upload" button has a distinct disabled state (grayed-out background, muted text, `cursor-not-allowed`) that is strictly enforced until a file is actually selected in the dropzone.
* **Loading States:** Implement asynchronous loading indicators. When "Upload" or "Ask" is triggered, replace the button text with an SVG loading spinner and temporarily disable the button to prevent duplicate API calls while waiting for the LLM/embedding response.