
# ipynao

[![Build Status](https://github.com/jupyter-robotics/ipynao/actions/workflows/build.yml/badge.svg)](https://github.com/jupyter-robotics/ipynao/actions/workflows/build.yml)
[![lite-badge](https://jupyterlite.rtfd.io/en/latest/_static/badge-launch.svg)](https://jupyter-robotics.dev/lab/index.html?path=introduction.ipynb)

A widget library for controlling Nao

[![Video of ipynao in JupyterLite](https://raw.githubusercontent.com/jupyter-robotics/ipynao/main/docs/assets/nao_hey.gif)](https://www.youtube.com/watch?v=3v2gOTS5anQ)

## Installation

You can install using `pip`:

```bash
pip install ipynao
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] ipynao
```

## Development Installation

Create a dev environment:
```bash
conda create -n ipynao-dev -c conda-forge nodejs yarn python jupyterlab
conda activate ipynao-dev
```

Install the python. This will also build the TS package.
```bash
pip install -e ".[test, examples]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For lab, this is done by the command:

```
jupyter labextension develop --overwrite .
yarn run build
```

For classic notebook, you need to run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py ipynao
jupyter nbextension enable --sys-prefix --py ipynao
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
yarn run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.

## Updating the version

To update the version, install tbump and use it to bump the version.
By default it will also create a tag.

```bash
pip install tbump
tbump <new-version>
```

