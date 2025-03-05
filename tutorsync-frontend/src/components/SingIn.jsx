function SingIn() {
    return (
        <form action="" className="d-flex flex-column">
            <div className="form-group p-3">
                <label
                    htmlFor="exampleInputEmail1"
                    className="mb-2 fs-5 fw-semibold"
                >
                    Email address
                </label>
                <input
                    type="email"
                    className="form-control"
                    id="exampleInputEmail1"
                    aria-describedby="emailHelp"
                    placeholder="Enter email"
                />
                <small id="emailHelp" className="form-text text-muted">
                    We'll never share your email with anyone else.
                </small>
            </div>
            <div className="form-group p-3 ">
                <label
                    htmlFor="exampleInputPassword1"
                    className="mb-2 fs-5 fw-semibold"
                >
                    Password
                </label>
                <input
                    type="password"
                    className="form-control"
                    id="exampleInputPassword1"
                    placeholder="Password"
                />
            </div>
            <div className="form-group text-lg-center p-4 mt-5">
                <button type="submit" className="btn btn-primary w-100">
                    Sign in
                </button>
            </div>
        </form>
    );
}

export default SingIn;
