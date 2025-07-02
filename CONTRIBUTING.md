# CONTRIBUTING.md — Sofia Desktop Agent

## General Guidelines for Contributors and Codex (AI Generation)

### 1. Structure and Modularity
- All pull requests, auto-generation and code changes must follow the project's folder structure (see README.md).
- If any file exceeds 2000 lines or words, split it into logical modules.
- All code must have comments in Russian for every function, class, and important block.

### 2. Naming Conventions

- **snake_case** — variables, functions, and methods (e.g., `get_user_input`, `send_message`)
- **UPPER_SNAKE_CASE** — constants (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Classic PascalCase** — classes (e.g., `MainWindow`, `SofiaAssistant`)
- **Custom_Style_Naming** (capitalize each word, separated by underscores; e.g., `Process_Event`, `Run_Background_Task`, `Check_Proxy_Status`, `Handle_Error_Message`).  
  Use for internal helper functions or where you want extra visual separation.

#### Example:
- Class: `MainWindow`, `SofiaAssistant`
- Function: `get_user_input`, `send_message`, `Process_User_Input`, `Run_Background_Task`
- Variable: `user_message`, `is_active`
- Constant: `MAX_RETRIES`, `DEFAULT_API_URL`
- Service/internal function: `Process_Event`, `Handle_Error_Message`

### 3. File Organization
- All new modules/classes should go to their intended folders: `core/`, `gui/`, `utils/`, `config/`, `tests/`.
- Do not mix unrelated logic in one file.
- Each module/file should serve one logical purpose.

### 4. Documentation and Comments
- Every function and class must have a docstring in Russian:
    """
    Функция делает то-то...
    Аргументы:
        arg1 (тип): описание
    Возвращает:
        тип — описание
    """
- Complex code blocks must be commented (in Russian) above or beside the block.
- Each class must be described briefly at the top.

### 5. Restrictions
- One file should not exceed 2000 lines/words.
- If a file or class grows too large, split it further.
- Avoid "magic numbers" and non-descriptive names.

### 6. Special Instructions for Codex/AI
- Always follow the naming conventions above when generating code.
- All tasks should be specified clearly:
    - Which file, which folder
    - Names for functions/classes as per the guide
    - Where comments/docstrings are required, what the function/class should return
- Every module/file should end with a short description of its purpose and extension points.

---

## If a file breaks these rules, do not approve the pull request — ask to fix style issues first!
## Язык комментариев и документации

Codex и все участники проекта обязаны использовать **русский язык** во всех комментариях, docstring и описаниях функций/классов.  
Не допускается использование английского языка внутри исходного кода — только русский.