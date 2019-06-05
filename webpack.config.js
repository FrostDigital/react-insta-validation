const path = require("path");

module.exports = {
	mode: "development",
	entry: "./src/index.js",
	devtool: "source-map",
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "index.js",
		libraryTarget: "umd",
		library: "react-insta-validation"
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, "src"),
				exclude: [/(node_modules|build)/, /(test.js)/],
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"]
					}
				}
			}
		]
	},
	resolve: {
		alias: {
			react: path.resolve(__dirname, "./node_modules/react"),
			"react-dom": path.resolve(__dirname, "./node_modules/react-dom")
		}
	},
	externals: ["react", "react-dom", "prop-types", "react-transition-group", "classnames"]
};
