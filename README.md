# bitxor-apirest

Bitxor APIREST gateway combines HTTP and WebSockets to perform read and write actions on the blockchain.

## Requirements

- Node.js 12 LTS
- [yarn][yarn] dependency manager
- [docker][docker]
- [bitxor-bootstrap][bitxor-bootstrap] 

## Installation

1. Validate you are able to run Bootstrap by following the [requirements](https://github.com/bitxorcorp/bitxor-bootstrap#requirements).

2. Install the project dependencies:

```
./yarn_setup.sh
```

3. Run a BitxorCore Server:


4. Run bitxor-apirest:

In another terminal:

```
yarn start:dev
```

If everything goes well, you should see bitxor-apirest running by opening ``http://localhost:3000/node/info`` in a new browser tab.


## Usage

Please refer to the [documentation](https://docs.bitxor.org/api) for more information.

## Versioning

Make sure you choose a [version compatible](COMPATIBILITY.md) with the [bitxorcore-server][bitxorcore-server] node you want to use it with.

Starting on `v1.1.0`, version numbers are described as follows:

`vX.Y.Z`

- X: This serves to lock for compatibility with `bitxorcore-server`, thus it is safe to update by keeping this number without REST
losing server compatibility. Additionally, any breaking change to the server should require to upgrade this number.
- Y: This serves to lock on safe updates to this project, thus it is safe to update by keeping this number without worrying about
introducing breaking changes.
- Z: Represents minor changes progress, used to identify specific versions when reporting bugs, or to get extensions to the code.

## Contributing

Before contributing please [read this](CONTRIBUTING.md) and consider the following guidelines:
- Submit small and concise PRs that address a single and clear feature or issue
- Submit only fully tested code
- Split test scope areas with _Arrange/Act/Assert_ comments
- Use spontaneous comments only when necessary
- Follow linting rules - tests are set to fail if those aren't followed
- Notify or update related API resources of accepted changes ([OpenAPI](https://github.com/bitxorcorp/bitxor-openapi))

## License

Copyright (c) 2022 Kriptxor Corp, Microsula S.A. Licensed under the [GNU Lesser General Public License v3](LICENSE)

[yarn]: https://yarnpkg.com/lang/en/
[bitxorcore-server]: https://github.com/bitxorcorp/bitxorcore
[bitxor-bootstrap]: https://github.com/bitxorcorp/bitxor-bootstrap
[docker]: https://www.docker.com
[api-node]: https://docs.bitxor.org/server.html#installation
