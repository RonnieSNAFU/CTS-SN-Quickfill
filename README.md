# CTS SN Quickfill

## Overview

CTS SN Quickfill is a Chrome extension designed to streamline and accelerate the process of completing forms and records within ServiceNow instances. It allows users to save, manage, and quickly apply predefined default values and custom entries to common fields, significantly reducing manual data entry and improving efficiency.
### I created this before I knew ServiceNow Templates were a thing but still like my version more. The use case for this over templates is if you need to quickly adjust fields you input and want to do so quickly.

## Features

*   **Quick Fill Modal:** A user-friendly modal interface to input and apply values to various ServiceNow fields.
*   **Customizable Defaults:** Set and save default values for fields like Category, Channel, State, Caller, Configuration Item, Assignment Group, and Assigned To.
*   **Dynamic Dropdowns:** Save and manage lists of frequently used entries for fields like Caller, Configuration Item, etc., with easy selection and removal.
*   **Auto-Open on New:** Optionally configure the modal to automatically open when a new record form is loaded in ServiceNow.
*   **On-Page "Quickfill Defaults" Button:** A convenient button directly on the ServiceNow form to apply all saved default values with a single click.
*   **Smart Field Interaction:** Designed to correctly trigger ServiceNow's internal field processing for reliable data assignment.
*   **User-Friendly Interface:** Clear labels, intuitive controls, and visual cues for default settings.

## Screenshots

Here's a look at the CTS SN Quickfill extension:

**1. The Main Quickfill Modal:**
   *Description: The main pop-up modal with various fields.*
   ![image](https://github.com/user-attachments/assets/d3084ac3-a8c7-470c-92dd-01da387f0366)
![image](https://github.com/user-attachments/assets/d3084ac3-a8c7-470c-92dd-01da387f0366)


**2. Custom Dropdown for a Field (e.g., Caller):**
   *Description: Expanded custom dropdown with saved entries and the remove button.*
![chrome_399cH3dbpf](https://github.com/user-attachments/assets/ad9684cd-e91c-404c-8eef-80210c100ac2)
![chrome_399cH3dbpf](https://github.com/user-attachments/assets/ad9684cd-e91c-404c-8eef-80210c100ac2)
![chrome_PBBFKvSgcn](https://github.com/user-attachments/assets/9733950d-4c91-449d-bba9-11746a8a608b)
![chrome_PBBFKvSgcn](https://github.com/user-attachments/assets/9733950d-4c91-449d-bba9-11746a8a608b)

  

**3. "Set as Default" Button Highlighted:**
   *Description: Shows a field with a value set and the "Set as Default" button highlighted or in its 'is-default' state.*
![chrome_Ux2ChfsA6s](https://github.com/user-attachments/assets/fdca851b-84c3-4df5-902e-4f71a09d45d7)
![chrome_Ux2ChfsA6s](https://github.com/user-attachments/assets/fdca851b-84c3-4df5-902e-4f71a09d45d7)


**4. On-Page "Quickfill Defaults" Button:**
   *Description: Shows the green "Quickfill Defaults" button on a ServiceNow form.*
![image](https://github.com/user-attachments/assets/2c52b9ab-7d82-40e0-b9bd-c06ab45aedb9)
![image](https://github.com/user-attachments/assets/2c52b9ab-7d82-40e0-b9bd-c06ab45aedb9)


**5. Auto-Open Toggle Switch:**
   *Description: Shows the "Auto-Open on New" toggle switch in the modal.*

![image](https://github.com/user-attachments/assets/85eb8396-4032-460e-8cf1-c19c0ccbe5a0)
![image](https://github.com/user-attachments/assets/85eb8396-4032-460e-8cf1-c19c0ccbe5a0)


## Installation

### From Chrome Web Store (Recommended BUT doesn't update immediately when I publish code)

1.  [Navigate to the CTS SN Quickfill extension page on the Chrome Web Store.](https://chromewebstore.google.com/detail/cts-sn-quickfill/eadefppnebkkoidiehagfbkppiahlioh)
2.  Click "Add to Chrome".
3.  Confirm the installation.

### Manual Installation (For Development/Testing)

1.  Download or clone this repository.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle switch in the top right corner.
4.  Click the "Load unpacked" button.
5.  Select the directory where you downloaded/cloned the extension files (the directory containing `manifest.json`).

## Usage

1.  **Open the Modal:**
    *   Click the CTS SN Quickfill extension icon in your Chrome toolbar when you are on a ServiceNow page.
    *   If "Auto-Open on New" is enabled, the modal will appear automatically when you open a new record form in ServiceNow.

2.  **Filling Fields:**
    *   **Select Lists (Category, Channel, State):** Choose a value from the dropdown.
    *   **Custom Dropdown Fields (Caller, Configuration Item, etc.):**
        *   Type to filter existing saved entries or type a new entry.
        *   Click the dropdown arrow to see all saved entries.
        *   Click an entry to select it.
        *   To save a new typed entry, type it in the input field and click the `+` (plus) button next to it.
        *   To remove a saved entry, click the `×` (times) button next to it in the dropdown panel.
    *   **Short Description:** Type directly into the textarea.

3.  **Setting Defaults:**
    *   After selecting or typing a value in any field within the modal, click the "Set as Default" button next to that field. The button will highlight to indicate the current value is now the saved default.

4.  **Applying Values:**
    *   **Fill & Close (Modal):** After making your selections in the modal, click the "Fill & Close" button. This will populate the corresponding fields on the ServiceNow form and close the modal.
    *   **Quickfill Defaults (On-Page Button):** When on a ServiceNow form, click the green "Quickfill Defaults" button (usually located near other form action buttons). This will populate all fields on the ServiceNow form with their saved default values from the extension.

5.  **Auto-Open on New:**
    *   Toggle the "Auto-Open on New" switch at the top of the modal to enable or disable the modal from automatically appearing when you navigate to a new record page in ServiceNow.

## Known Issues / Limitations
*   This only works in the old service now experience, I have not even attempted to try and make it work with the new experience.
*   The on-page "Quickfill Defaults" button placement relies on a specific element ID (`#cxs_maximize_results`) in the ServiceNow DOM. If this ID changes in future ServiceNow UI updates, the button might not appear or might appear in an unintended location.
*   While efforts have been made to ensure compatibility, extremely customized ServiceNow instances might have UI structures that could affect field interaction.

## Contributing

If you'd like to contribute to the development of CTS SN Quickfill, please feel free to:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Create a new Pull Request.

Created by Ronnie Aishman



[Link to extension on chrome store (takes a while to udpate if I push code to it)](https://chromewebstore.google.com/detail/eadefppnebkkoidiehagfbkppiahlioh)
