# Learnings from Facial Service and Benchmark Debugging (2026-02-07)

This document summarizes key challenges, errors, and resolutions encountered during the setup and debugging of the `facial_service` and the `truth-hire-datasets` benchmark.

## 1. Persistent `numpy`/`tables` Binary Incompatibility
**Problem:** Repeated `ValueError: numpy.dtype size changed, may indicate binary incompatibility. Expected 96 from C header, got 88` errors when `py-feat` (via `deepdish` and `nltools`) attempted to build or use `tables`. This occurred even with Python 3.9, which was chosen for better compatibility. The issue was present in both the `facial_service` and `truth-hire-datasets` virtual environments.

**Resolution:**
To resolve this, a specific older version of `numpy` and `scipy` had to be explicitly installed *before* installing `py-feat` or its dependencies.
- **For `facial_service` `venv`:**
    1. `uv venv -p python3.9 --clear`
    2. `source venv/bin/activate`
    3. `uv pip install numpy==1.23.0 scipy==1.10.0`
    4. `uv pip install -r requirements.txt --no-build-isolation`
- **For `truth-hire-datasets` `.venv`:**
    1. `uv venv -p python3.9 --clear`
    2. `source .venv/bin/activate`
    3. `uv pip install numpy==1.23.0 scipy==1.10.0`
    4. `uv pip install pandas requests py-feat --no-build-isolation` (assuming `pandas` and `requests` are needed by benchmark script)

**Key Takeaway:** When dealing with complex dependency chains involving C extensions (like `tables` and `numpy`), automatic dependency resolution by `pip` or `uv` might pick versions that are binary incompatible even if they appear compatible by version number. Explicitly pinning and pre-installing known compatible versions can prevent build failures. The `--no-build-isolation` flag was crucial to prevent `uv` from trying to build `tables` in an isolated environment that didn't have the pre-installed `numpy`.

## 2. Correct `facial_service` Startup and Logging
**Problem:** Initial attempts to start the `facial_service` using a non-existent `start-service.sh` script or direct `uvicorn` commands failed silently or with misleading errors, making debugging difficult.

**Resolution:**
- **Correct Startup Command:** The `facial_service` is started directly using `uvicorn main:app --host 0.0.0.0 --port 8001` within its activated virtual environment.
- **Robust Logging:** When running `uvicorn` in the background, redirect all output to a log file (`> uvicorn_facial_service.log 2>&1`) to capture all startup messages and errors. This allowed diagnosis of the successful startup when direct `process action:log` yielded no output.
    ```bash
    cd truth-hire-mvp/ml-services/facial_service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 > uvicorn_facial_service.log 2>&1 &
    ```
- **Health Check:** Regularly use `curl http://localhost:8001/health` to verify service availability and health.

**Key Takeaway:** Always ensure accurate paths for scripts and executables. For background processes, redirecting `stdout` and `stderr` to a persistent log file is essential for post-mortem debugging, especially when interactive logging is not feasible.

## 3. Limitations of `claude-code` for Interactive Login
**Problem:** Attempted to use `claude-code` for persistent logging, but it required an interactive `/login` step that an agent cannot perform.

**Resolution:** Reverted to direct `uvicorn` execution with file-based logging.

**Key Takeaway:** `claude-code` (and similar interactive coding agents) are not suitable for tasks requiring interactive user input for authentication or other prompts. Use them for tasks that are fully autonomous or can be driven by clear, non-interactive commands.

## 4. Benchmark Script Environment
**Problem:** The benchmark script (`truth-hire-datasets/scripts/run_benchmark.py`) initially failed with `zsh:1: no such file or directory: venv/bin/python` because it lacked its own properly configured virtual environment.

**Resolution:** Created a separate `.venv` within the `truth-hire-datasets` repository and installed its dependencies, again applying the `numpy`/`scipy` pinning strategy.

**Key Takeaway:** Each project or component should have its own isolated virtual environment. Do not assume that dependencies installed for one service (e.g., `facial_service`) will be available or compatible for another (e.g., `benchmark` script), even if they share some common packages.

## 5. Current Blocking Issue: `facial_service` Analysis Failure
**Problem:** The `facial_service` reports as `healthy`, but during benchmark execution, it consistently returns `Service error: None` for all video analysis requests. This results in all benchmark scores being 0.00 and predictions defaulting to "truthful", indicating the core analysis logic is failing.

**Next Steps:**
- Investigate `uvicorn_facial_service.log` for any runtime errors or exceptions from the `facial_service` during video processing.
- Review the `main.py` code within `facial_service` to understand how it handles video input and calls the underlying `py-feat` library.
- Potentially run a small, isolated test directly against the `facial_service` endpoint with a single video file to get more detailed error messages.
