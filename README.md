## MiniGPT-4-ui

This is a fork of https://github.com/Vision-CAIR/MiniGPT-4 which also provides a simple ui and API.

![image](https://github.com/rjmacarthy/MiniGPT-4-ui/assets/5537428/f301735a-2314-433f-a371-e26d7ef0b900)

### Usage

Images are saved to a psql database see `minigpt4/database/repository.py` for the connection details.

Follow all instructions to setup MiniGPT-4 on the official repository linked above.

Run the server:
```
python api.py
```

Start the ui:
```
cd ui
npm start
```

### Changes

The main changes from the original repository are the `ui` folder, the `api.py` file, the `database` folder and the `minigpt4/service/minigpt4_service.py` file.  The rest is just refactoring and code clean up.
